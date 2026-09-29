require("dotenv").config();

const express = require("express");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

let hindsight;

function getCookie(req, name) {

    const cookies = req.headers.cookie || "";

    const parts = cookies.split(";");

    for (const part of parts) {

        const [key, ...valueParts] = part.trim().split("=");

        if (key === name) {

            return decodeURIComponent(valueParts.join("="));

        }

    }

    return null;
}


function setCustomerCookie(res, customerId) {

    res.setHeader(
        "Set-Cookie",
        `recalldesk_customer=${encodeURIComponent(customerId)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=31536000`
    );

}




function extractCustomerName(message) {

    if (!message) {
        return null;
    }

    // Example:
    // "My name is Priya"
    let match = message.match(
        /\bmy\s+name\s+is\s+([A-Za-z][A-Za-z'-]*)/i
    );

    if (match) {
        return match[1];
    }


    // Example:
    // "I'm Priya"
    match = message.match(
        /\bi['’]?m\s+([A-Za-z][A-Za-z'-]*)/i
    );

    if (match) {
        return match[1];
    }


    // Example:
    // "I am Priya"
    match = message.match(
        /\bi\s+am\s+([A-Za-z][A-Za-z'-]*)/i
    );

    if (match) {
        return match[1];
    }


    // Example:
    // "Customer Priya uses an iPhone 15"
    match = message.match(
        /\bcustomer\s+([A-Za-z][A-Za-z'-]*)/i
    );

    if (match) {
        return match[1];
    }


    return null;
}




function normalizeCustomerId(name) {

    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}


function getCustomerId(req, res, message) {

    // First use the existing customer cookie.
    const existingCustomer = getCookie(
        req,
        "recalldesk_customer"
    );

    if (existingCustomer) {

        return existingCustomer;

    }


    // If there is no cookie, try to identify
    // the customer from the first message.
    const detectedName = extractCustomerName(message);


    if (detectedName) {

        const customerId =
            normalizeCustomerId(detectedName);

        setCustomerCookie(res, customerId);

        return customerId;

    }


    // If no name is available, create an anonymous
    // isolated customer session.
    const anonymousId =
        `anonymous-${crypto.randomUUID()}`;

    setCustomerCookie(res, anonymousId);

    return anonymousId;
}




function getCustomerBankId(customerId) {

    return `recalldesk-user-${customerId}`;

}




async function startServer() {

    const { HindsightClient } =
        await import("@vectorize-io/hindsight-client");


    hindsight = new HindsightClient({

        baseUrl:
            process.env.HINDSIGHT_BASE_URL,

        apiKey:
            process.env.HINDSIGHT_API_KEY

    });


    
    app.get("/", (req, res) => {

        res.json({

            message:
                "RecallDesk backend is running"

        });

    });


    
    
    app.post("/test-memory", async (req, res) => {

        try {

            const message = req.body.message;


            if (!message) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Message is required"

                });

            }


            const customerId =
                getCustomerId(
                    req,
                    res,
                    message
                );


            const bankId =
                getCustomerBankId(
                    customerId
                );


            await hindsight.retain(

                bankId,

                `Customer support conversation: ${message}`,

                {

                    context:
                        "RecallDesk customer support",

                    metadata: {

                        customerId:
                            customerId

                    }

                }

            );


            const result =
                await hindsight.recall(

                    bankId,

                    message

                );


            res.json({

                success: true,

                customerId:

                    customerId,

                bankId:

                    bankId,

                message:
                    "Memory stored successfully",

                memories:
                    result.results

            });


        } catch (error) {

            console.error(error);


            res.status(500).json({

                success: false,

                error:
                    error.message

            });

        }

    });


    

    app.get("/memory", async (req, res) => {

        try {

            const customerId =
                getCustomerId(
                    req,
                    res,
                    ""
                );


            const bankId =
                getCustomerBankId(
                    customerId
                );


            const result =
                await hindsight.recall(

                    bankId,

                    "customer support history previous issues problems solutions device payment login"

                );


            const memories =
                result.results
                    .slice(0, 5)
                    .map(memory => memory.text);


            res.json({

                success: true,

                customerId:

                    customerId,

                memories:

                    memories

            });


        } catch (error) {

            console.error(error);


            res.status(500).json({

                success: false,

                error:
                    error.message

            });

        }

    });


   

    app.post("/chat", async (req, res) => {

        try {

            const {
                message
            } = req.body;


            if (!message) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Message is required"

                });

            }


        
            const customerId =
                getCustomerId(
                    req,
                    res,
                    message
                );


            

            const bankId =
                getCustomerBankId(
                    customerId
                );


            console.log(
                `Customer: ${customerId}`
            );

            console.log(
                `Hindsight bank: ${bankId}`
            );

            await hindsight.retain(

                bankId,

                `Customer support conversation: ${message}`,

                {

                    context:
                        "RecallDesk customer support",

                    metadata: {

                        customerId:
                            customerId

                    }

                }

            );

            const response =
                await hindsight.reflect(

                    bankId,

                    `You are RecallDesk, a customer support agent.

The customer has sent this message:

"${message}"

Use ONLY the memories belonging to this customer.

Important rules:

- Never use another customer's information.
- Never mention information from another customer.
- Do not make the customer repeat information that is already known.
- Remember previous problems and solutions for this customer.
- Do not recommend a solution that this customer already tried unsuccessfully.
- Give a clear and helpful next step.
- If important information is missing, ask only for that information.
- Be polite and concise.
- If the memory does not contain the requested information, say that you do not have that information.
- Do not guess.

Respond directly to the customer.`

                );

            res.json({

                success: true,

                response:
                    response.text,

                customerId:
                    customerId,

                based_on:
                    response.based_on

            });


        } catch (error) {

            console.error(error);


            res.status(500).json({

                success: false,

                error:
                    error.message

            });

        }

    });


    app.listen(

        PORT,

        () => {

            console.log(

                `RecallDesk server running on port ${PORT}`

            );

        }

    );

}


startServer();