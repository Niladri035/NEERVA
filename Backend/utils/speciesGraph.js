const { StateGraph, START, END, Annotation } = require("@langchain/langgraph");
const axios = require('axios');

/**
 * Modern LangGraph State Definition (v0.2+ / v1.x compatible)
 */
const GraphAnnotation = Annotation.Root({
  imageData: Annotation({ 
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => "" 
  }),
  speciesInfo: Annotation({ 
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}) 
  }),
  isValid: Annotation({ 
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => false 
  }),
  error: Annotation({ 
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null 
  }),
});

const createSpeciesGraph = (apiKey) => {
  // 1. Vision Node
  const visionNode = async (state) => {
    try {
      console.log('👁️  Vision Node: Identifying species...');
      
      const img = state.imageData;
      if (!img) throw new Error('Image data is missing in state');

      const VISION_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
      const base64Data = img.replace(/^data:image\/\w+;base64,/, '');

      const prompt = `You are a marine biologist. Identify the marine species in this image.
      If no marine animal is visible, say "NOT_A_FISH".
      Otherwise, provide the Common Name and Scientific Name.`;

      const response = await axios.post(VISION_URL, {
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
          ]
        }]
      }, { timeout: 15000 });

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('🤖 Agent Identification:', text);
      
      if (text.includes("NOT_A_FISH") || !text) {
        return { isValid: false, error: "No marine species detected." };
      }

      return { 
        speciesInfo: { rawIdentification: text },
        isValid: true 
      };
    } catch (err) {
      console.error('❌ Vision Error:', err.message);
      return { error: `Vision analysis failed: ${err.message}` };
    }
  };

  // 2. Enrichment Node
  const enrichmentNode = async (state) => {
    if (!state.isValid || state.error) return state;

    try {
      console.log('🧪 Enrichment Node: Processing metadata for', state.speciesInfo.rawIdentification);
      const ENRICH_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
      
      const prompt = `You are a marine biologist. Based on "${state.speciesInfo.rawIdentification}", provide a scientific report.
      Return ONLY this JSON:
      {
        "species_name": "Common name",
        "scientific_name": "Scientific name",
        "confidence": 0.98,
        "habitat": "Habitat detail",
        "conservation_status": "IUCN Status",
        "diet": "Diet info",
        "fun_fact": "Biologist fact"
      }`;

      const response = await axios.post(ENRICH_URL, {
        contents: [{ parts: [{ text: prompt }] }]
      });

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI failed to structure species metadata');
      
      const data = JSON.parse(jsonMatch[0]);
      return { 
        speciesInfo: {
          ...data,
          species: data.scientific_name,
          commonName: data.species_name,
          conservationStatus: data.conservation_status,
          description: data.fun_fact
        }
      };
    } catch (e) {
      console.error('❌ Enrichment Error:', e.message);
      return { error: `Scientific enrichment failed: ${e.message}` };
    }
  };

  // Build the graph
  const workflow = new StateGraph(GraphAnnotation)
    .addNode("vision", visionNode)
    .addNode("enrichment", enrichmentNode)
    .addEdge(START, "vision")
    .addEdge("vision", "enrichment")
    .addEdge("enrichment", END);

  return workflow.compile();
};

module.exports = { createSpeciesGraph };
