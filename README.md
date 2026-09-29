# RecallDesk

### Support that remembers.

RecallDesk is an AI-powered customer support assistant that remembers
previous customer interactions and uses that context to provide
personalized support without making the customer repeat their problem.

## Problem

Traditional customer support systems often make customers repeat the
same issue every time they contact support.

RecallDesk solves this by giving the support agent persistent memory
of previous interactions.

## Key Features

- Persistent customer memory
- Personalized support responses
- Automatic extraction of important facts
- Remembers previous problems and troubleshooting attempts
- Context-aware conversations
- Simple customer support interface
- Hindsight-powered memory

## How It Works

1. Customer describes a problem.
2. RecallDesk stores important information from the interaction.
3. Hindsight converts the interaction into useful memories.
4. When the customer returns, RecallDesk retrieves relevant memories.
5. The AI uses those memories to generate a personalized response.

## Example

Customer previously reported:

- Uses Android 14
- Payment failed twice
- Restarting the app did not solve the problem

Later, the customer says:

> "It is happening again."

RecallDesk remembers the previous interaction and responds using
that context instead of treating it as a completely new issue.

## Tech Stack

- HTML
- CSS
- JavaScript
- Node.js
- Hindsight
- Hindsight Client SDK
- REST API

## Project Structure

```text
RecallDesk/
│
├── public/
│   └── index.html
│
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
└── README.md