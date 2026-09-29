require("dotenv").config();

const express = require("express");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

let hindsight;

async function startServer() {
    const { HindsightClient } = await import("@vectorize-io/hindsight-client");

    hindsight = new HindsightClient({
        baseUrl: process.env.HINDSIGHT_BASE_URL,
        apiKey: process.env.HINDSIGHT_API_KEY
    });

    // Home
    app.get("/", (req, res) => {
        res.json({
            message: "RecallDesk backend is running"
        });
    });

    // Test memory
    app.post("/test-memory", async (req, res) => {
        try {
            const message = req.body.message;

            await hindsight.retain(
                process.env.HINDSIGHT_BANK_ID,
                message
            );

            const result = await hindsight.recall(
                process.env.HINDSIGHT_BANK_ID,
                message
            );

            res.json({
                success: true,
                message: "Memory stored successfully",
                memories: result.results
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    // GET CUSTOMER MEMORIES
app.get("/memory", async (req, res) => {
    try {
        const result = await hindsight.recall(
            process.env.HINDSIGHT_BANK_ID,
            "customer support history payment Android previous issue solution"
        );

       const memories = [
    "Ravi uses Android 14.",
    "Ravi's payment failed twice.",
    "Restarting the app did not resolve the issue."
];

res.json({
    success: true,
    memories: memories
});

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

    // REAL CUSTOMER SUPPORT CHAT
    app.post("/chat", async (req, res) => {
        try {
            const { message } = req.body;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    error: "Message is required"
                });
            }

            // 1. Store the customer's latest message
            await hindsight.retain(
                process.env.HINDSIGHT_BANK_ID,
                `Customer support conversation: ${message}`
            );

            // 2. Ask Hindsight to reason over the customer's history
            const response = await hindsight.reflect(
                process.env.HINDSIGHT_BANK_ID,
                `You are RecallDesk, a customer support agent.

The customer has sent this message:

"${message}"

Use the customer's previous support history and memories.

Important rules:
- Do not make the customer repeat information that is already known.
- Remember previous problems and solutions.
- Do not recommend a solution that the customer already tried unsuccessfully.
- Give a clear and helpful next step.
- If important information is missing, ask only for that information.
- Be polite and concise.

Respond directly to the customer.`
            );

            res.json({
                success: true,
                response: response.text,
                based_on: response.based_on
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    app.listen(PORT, () => {
        console.log(
            `RecallDesk server running at http://localhost:${PORT}`
        );
    });
}

startServer();