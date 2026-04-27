# 🚀 Automation Vibe Coding — Node-Based Automation Editor

A scalable, production-ready React application for building node-based automation workflows using **TypeScript** and **MVVM architecture**, designed for **AI-assisted development**.

---

# 🎯 Overview

This project is a **Node-Based Automation Tool** that allows users to:

* Create nodes (Log, Color, etc.)
* Connect them visually
* Execute workflows (automation flows)
* Save & load projects using a lightweight backend

---

# 🤖 AI Development Guidelines (IMPORTANT)

This project is optimized for development using AI tools.

## Core Rules

* Follow **MVVM architecture strictly**
* Do NOT mix UI with business logic
* Keep components small and reusable
* Use Zustand only for global state
* Keep ViewModels pure (no UI logic)

## Code Generation Rules

* Use strict TypeScript typing
* Avoid `any`
* Keep code modular and scalable
* Follow folder structure strictly

## Node System Rules

* Each node must be independent
* Nodes communicate via edges
* Execution logic must be separate from UI

---

# 🗺️ Development Roadmap

## Phase 1

* Canvas (React Flow)
* Basic node rendering

## Phase 2

* Node types (Log, Color)
* Connection system

## Phase 3

* Execution engine

## Phase 4

* Supabase integration (Save / Load)

## Phase 5 (Optional)

* Advanced nodes (Delay, Condition, API)

---

# 📁 Project Structure

```
src/
├── components/
│   ├── common/
│   ├── nodes/
│   └── layout/
│
├── features/
│   ├── automation/
│   │   ├── models/
│   │   ├── viewmodels/
│   │   ├── services/
│   │   └── views/
│   ├── nodeLibrary/
│   └── execution/
│
├── store/
├── hooks/
├── utils/
├── api/
├── styles/
├── types/
│
├── App.tsx
└── index.tsx
```

---

# 🏗️ Architecture

## MVVM Pattern

* **Models** → Data structures
* **ViewModels** → Business logic
* **Services** → API & data access
* **Views** → UI components

## Data Flow

```
Component → Hook → ViewModel → Service → API → Store → UI
```

---

# 🧩 System Overview

* UI Layer → React Components
* State Layer → Zustand
* Logic Layer → ViewModels
* Data Layer → Services + API
* Storage → Supabase

---

# ⚙️ Execution Flow

1. User clicks "Run"
2. System reads nodes & edges
3. Builds graph structure
4. Traverses nodes
5. Executes logic
6. Outputs results

---

# 🔧 Installation & Setup

## Prerequisites

* Node.js 16+
* npm or yarn

## Install

```bash
npm install
```

## Dependencies

```bash
npm install zustand axios reactflow
npm install -D typescript
```

## Environment Variables

```env
REACT_APP_API_URL=http://localhost:3001
```

## Run

```bash
npm start
```

---

# 💬 AI Prompt Examples

## Create Node

"Create a reusable LogNode component compatible with React Flow"

## Execution Engine

"Implement a graph traversal execution engine for node-based workflows"

## State

"Create a Zustand store for managing nodes and edges"

## Backend

"Implement save/load functionality using Supabase"

---

# 🛠️ Development Guidelines

## Adding a Feature

1. Create feature folder
2. Add models
3. Create ViewModel
4. Implement service
5. Build UI
6. Connect API

---

## Naming Conventions

* Components → PascalCase
* Functions → camelCase
* Interfaces → prefix with `I`
* Files → meaningful names

---

# 📦 Scripts

* npm start
* npm run build
* npm test
* npm run lint

---

# 🧪 Testing Strategy

* Unit tests → utilities
* Component tests → UI
* Integration tests → features

---

# 🚀 Performance

* Lazy loading
* Memoization
* Efficient rendering

---

# 🔐 Security

* Input validation
* Safe API calls
* Token handling

---

# ⚠️ Constraints

* Do not add new state libraries
* Do not break MVVM
* Avoid over-engineering
* Keep it simple

---

# ✅ Definition of Done

A feature is complete when:

* Follows MVVM
* Fully typed
* No errors
* Works with state
* Tested manually

---

# 🔮 Future Enhancements

* More node types
* Sharing workflows
* Collaboration
* Real-time execution

---

# 🤝 Contributing

* Follow structure
* Keep code clean
* Document logic
* Update README if needed

---

# 🎉 Final Note

This is not just a UI project.

> It is a **mini automation system** built with scalable architecture and AI-assisted development.

---
