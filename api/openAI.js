import OpenAI from "openai";
import dotenv from 'dotenv';
import { data } from '../data.js';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const openAI = async (base64Image, mimeType) => {
  try {
    console.log("Converting image buffer to base64...");
    console.log("Calling OpenAI with base64Image and mimeType...");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4096,
      temperature: 0,
      messages: [
        {
          role: "system",
          content: "You are an AI assistant specialized in analyzing mathematical theorems and creating spatial summaries. Use the provided reference spatial summary as a guide for creating a new summary for the given theorem. Mimic the style, layout, and reasoning of the reference summary while adapting it to the new theorem's content. Ensure that the output follows the exact schema of the reference, including property names and capitalization."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Reference spatial summary:"
            },
            {
              type: "text",
              text: JSON.stringify(data) // Your database JSON object
            },
            {
              type: "text",
              text: "New theorem to analyze:"
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            },
            {
              type: "text",
              text: "Create a StoryAI structure for the new theorem, using the reference summary as a guide for layout and reasoning. Ensure that the output schema matches the reference exactly, including property names and capitalization."
            }
          ]
        }
      ],
      functions: [
        {
          name: "create_story_ai",
          description: "Create a StoryAI data structure with nodes and edges based on the image analysis, mimicking the style and reasoning of the reference summary",
          parameters: {
            type: "object",
            properties: {
              nodes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    Type: { type: "string", enum: ["Text", "Formula"] },
                    x: { type: "number" },
                    y: { type: "number" },
                    style: {
                      type: "object",
                      properties: {
                        color: { type: "string" },
                        fontSize: { type: "number" },
                        maxWidth: { type: "string" }
                      }
                    },
                    content: { type: "string" },
                    latex: { type: "string" }
                  },
                  required: ["id", "Type", "x", "y"]
                }
              },
              edges: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    source: { type: "string" },
                    target: { type: "string" }
                  },
                  required: ["source", "target"]
                }
              }
            },
            required: ["nodes", "edges"]
          }
        }
      ],
      function_call: { name: "create_story_ai" }
    });

    console.log("OpenAI response received successfully.");
    console.log("Response:", response);

    if (response.choices && response.choices.length > 0 && response.choices[0].message.function_call) {
      const functionCall = response.choices[0].message.function_call;
      console.log("Function call:", functionCall);

      if (functionCall.name === "create_story_ai") {
        const storyAIStructure = JSON.parse(functionCall.arguments);
        console.log("StoryAI structure:", storyAIStructure);
        console.log("StoryAI structure stringify:", JSON.stringify(storyAIStructure, null, 2));

        let storyAI;

        try {
          storyAI = parseStoryAIStructure(storyAIStructure);
          console.log("StoryAI with Parsed structure:", JSON.stringify(storyAI, null, 2));
        } catch (error) {
          console.error("Error:", error.message);
        }

        console.log("StoryAI:", storyAI);
        return storyAI;
      } else {
        console.log("Unexpected function call:", functionCall.name);
        return { error: "Unexpected function call", content: functionCall };
      }
    } else {
      console.log("Unexpected response structure:", JSON.stringify(response, null, 2));
      return { error: "Unexpected response structure", content: response };
    }
  } catch (error) {
    console.error("Error in AI processing:", error);
    throw error;
  }
};

function parseStoryAIStructure(input) {
  try {
    const storyObj = typeof input === 'string' ? JSON.parse(input) : input;

    if (!storyObj.nodes || !storyObj.edges) {
      throw new Error("Missing nodes or edges in the structure.");
    }

    const nodes = typeof storyObj.nodes === 'string' ? JSON.parse(storyObj.nodes) : storyObj.nodes;
    const edges = typeof storyObj.edges === 'string' ? JSON.parse(storyObj.edges) : storyObj.edges;

    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      throw new Error("Nodes and edges must be arrays.");
    }

    return { nodes, edges };
  } catch (error) {
    throw new Error("Error parsing StoryAI structure: " + error.message);
  }
}