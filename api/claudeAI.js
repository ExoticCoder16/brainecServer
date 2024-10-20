import Anthropic from "@anthropic-ai/sdk";
import dotenv from 'dotenv';
import { data } from '../data.js';

dotenv.config();

const key = process.env.ANTHROPIC_API_KEY;
const anthropic = new Anthropic({ apiKey: key });

export const claudeAI = async (base64Image, mimeType) => {
  try {
    console.log("Converting image buffer to base64...");
    console.log("Calling Claude AI with base64Image and mimeType...");

    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 4096,
      temperature: 0,
      system: "You are an AI assistant specialized in analyzing mathematical theorems and creating spatial summaries. Use the provided reference spatial summary as a guide for creating a new summary for the given theorem. Mimic the style, layout, and reasoning of the reference summary while adapting it to the new theorem's content.",
      messages: [
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
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: base64Image,
              },
            },
            {
              type: "text",
              text: "Create a StoryAI structure for the new theorem, using the reference summary as a guide for layout and reasoning."
            }
          ],
        }
      ],
      tools: [
        {
          name: "create_story_ai",
          description: "Create a StoryAI data structure with nodes and edges based on the image analysis, mimicking the style and reasoning of the reference summary",
          input_schema: {
            type: "object",
            properties: {
              nodes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    type: { type: "string", enum: ["text", "formula"] },
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
                  required: ["id", "type", "x", "y"],
                  if: {
                    properties: { type: { const: "Text" } }
                  },
                  then: {
                    required: ["content"]
                  },
                  else: {
                    required: ["latex"]
                  }
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
    //   tool_choice: { type: "auto" }
       tool_choice: {"type": "tool", "name": "create_story_ai"}
    });

    console.log("Claude AI response received successfully.");
    console.log("msg:", msg);
    // console.log("msg stringify:", JSON.stringify(msg, null, 2));

    if (msg.content && msg.content.length > 0 && msg.content[0].type === 'tool_use') {
      const toolUseContent = msg.content[0];
    //   console.log("Tool use content:", JSON.stringify(toolUseContent, null, 2));

      const storyAIStructure = toolUseContent.input;
      console.log("StoryAI structure:", storyAIStructure);
      console.log("StoryAI structure stringify:", JSON.stringify(storyAIStructure, null, 2));  // Full logging of style and everything

      let storyAI;

      try {
        storyAI = parseStoryAIStructure(storyAIStructure);
        console.log("StoryAI with Parsed structure:", JSON.stringify(storyAI, null, 2));  // Log parsed structure
      } catch (error) {
        console.error("Error:", error.message);
      }

      console.log("StoryAI:", storyAI);
      return storyAI;
    } else {
      console.log("Unexpected response structure:", JSON.stringify(msg.content, null, 2));
      return { error: "Unexpected response structure", content: msg.content };
    }
  } catch (error) {
    console.error("Error in AI processing:", error);
    throw error;
  }
};

function parseStoryAIStructure(input) {
    try {
      // If input is already an object, no need to parse it again
      const storyObj = typeof input === 'string' ? JSON.parse(input) : input;
  
      // Check for nodes and edges
      if (!storyObj.nodes || !storyObj.edges) {
        throw new Error("Missing nodes or edges in the structure.");
      }
  
      // Parse nodes and edges if they are strings, otherwise use them as-is
      const nodes = typeof storyObj.nodes === 'string' ? JSON.parse(storyObj.nodes) : storyObj.nodes;
      const edges = typeof storyObj.edges === 'string' ? JSON.parse(storyObj.edges) : storyObj.edges;
  
      // Validate that nodes and edges are arrays
      if (!Array.isArray(nodes) || !Array.isArray(edges)) {
        throw new Error("Nodes and edges must be arrays.");
      }
  
      // Return the parsed structure
      return { nodes, edges };
    } catch (error) {
      throw new Error("Error parsing StoryAI structure: " + error.message);
    }
  }
  
