# 🤖 AI Dev Team — Multi-Agent Software Development System

An autonomous multi-agent system that takes a software requirement, plans it, writes code, debugs it, tests it, and deploys — built with LangGraph + Gemini.

**Current: Phase 1 — PM Agent (Requirement → Specification)**


## ⚡ Quick Commands

npm i  
cd dashboard && npm install && cd ..  
npm run dev  


## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ installed  
- A Gemini API key (get one free: https://aistudio.google.com/api-keys)  
- (Optional) Redis for state persistence:

docker run -d -p 6379:6379 redis:latest  


### 2. Setup

```bash
# Clone/copy the project
cd ai-dev-team

# Install dependencies
npm install

# Create your .env file
cp .env.example .env

# Edit .env and add your GEMINI_API_KEY

```


### 3. Run
```
# Option 1: Pass requirement directly  
node src/index.js "Build a todo app with categories and due dates"  

# Option 2: Interactive mode  
node src/index.js  

```

### 4. What Happens

- PM Agent analyzes your requirement  
- If ambiguous → asks 3–8 clarifying questions  
- You answer in the terminal  
- Generates structured project specification  
- Displays token usage summary  


## 🧪 Testing
```
# Test 1: Graph skeleton (no API key needed)  
npm run test:graph  

# Test 2: PM Agent (requires GEMINI_API_KEY)  
npm run test:pm  
```

### Test 1: Graph Skeleton

- State flows correctly through nodes  
- Conditional routing works  
- Conversation history builds  
- Checkpointing saves state  


### Test 2: PM Agent

- Generates clarifying questions  
- Produces full project specification  
- Includes structure (appName, features, pages, DB)  
- Tracks token usage  


## 📂 Project Structure

ai-dev-team/  
├── src/  
│   ├── index.js  
│   ├── agents/  
│   │   └── pmAgent.js  
│   ├── nodes/  
│   │   └── humanInput.js  
│   ├── config/  
│   │   ├── state.js  
│   │   └── graph.js  
│   └── utils/  
│       ├── gemini.js  
│       └── tokenTracker.js  
├── tests/  
│   ├── test-graph-skeleton.js  
│   └── test-pm-agent.js  
├── .env.example  
└── package.json  


## ⚙️ How It Works (First Principles)

### The Graph

START → [pmAgent] ←→ [humanInput]  
        ↓ (spec_ready)  
        END  


### State

All nodes communicate through a shared state object.  
Node A writes → Node B reads.  
No direct function calls.  


### Checkpointing

- State is saved after every node  
- Uses Redis or memory  
- Resumes from last checkpoint if crash occurs  


### Token Tracking

- Every Gemini API call is tracked  
- Shows token usage + estimated cost  


## 🚀 What's Next

Phase 2 — Architect Agent + Validator  
Phase 3 — Planner Agent + Docker Sandbox  
Phase 4 — Context Builder + Coder Agent  
Phase 5 — Reviewer + Debugger  
Phase 6 — Feedback Loop + Deploy Agent  
Phase 7 — React Frontend Dashboard  

## 👨‍💻 Built By

Shaik Sameer Basha x Claude — April 2026
