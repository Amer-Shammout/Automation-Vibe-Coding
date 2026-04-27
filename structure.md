src/
├── components/                 # Reusable UI components
│   ├── common/                 # Generic components (Button, Modal, Input, etc.)
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   ├── nodes/                  # Node-specific components
│   │   ├── NodeCanvas.tsx
│   │   ├── NodeItem.tsx
│   │   └── NodePalette.tsx
│   └── layout/                 # Layout wrappers
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── MainLayout.tsx
│
├── features/                   # Feature modules following MVVM
│   ├── automation/
│   │   ├── models/             # Data models & types
│   │   │   ├── Automation.ts
│   │   │   ├── WorkflowStep.ts
│   │   │   └── types.ts
│   │   ├── viewmodels/         # Business logic & state management
│   │   │   ├── AutomationViewModel.ts
│   │   │   └── WorkflowViewModel.ts
│   │   ├── services/           # API calls & data operations
│   │   │   ├── AutomationService.ts
│   │   │   └── WorkflowService.ts
│   │   └── views/              # Feature-specific UI components
│   │       ├── AutomationList.tsx
│   │       ├── AutomationEditor.tsx
│   │       └── WorkflowBuilder.tsx
│   │
│   ├── nodeLibrary/
│   │   ├── models/
│   │   ├── viewmodels/
│   │   ├── services/
│   │   └── views/
│   │
│   └── execution/
│       ├── models/
│       ├── viewmodels/
│       ├── services/
│       └── views/
│
├── store/                      # Global state management (Zustand/Redux)
│   ├── slices/
│   │   ├── automationSlice.ts
│   │   ├── nodeSlice.ts
│   │   └── uiSlice.ts
│   ├── index.ts
│   └── types.ts
│
├── hooks/                      # Custom React hooks
│   ├── useAutomation.ts
│   ├── useNodeCanvas.ts
│   ├── useWorkflow.ts
│   └── useLocalStorage.ts
│
├── utils/                      # Utility functions
│   ├── validation.ts
│   ├── formatting.ts
│   ├── nodeHelpers.ts
│   ├── constants.ts
│   └── logger.ts
│
├── api/                        # API client & endpoints
│   ├── client.ts               # API instance (axios/fetch setup)
│   ├── endpoints/
│   │   ├── automationApi.ts
│   │   ├── nodeApi.ts
│   │   └── executionApi.ts
│   └── types.ts                # API response/request types
│
├── styles/                     # Global styles (if using CSS-in-JS/Tailwind config)
│   ├── globals.css
│   └── theme.ts
│
├── types/                      # Shared TypeScript types
│   ├── index.ts
│   └── common.ts
│
├── App.tsx                     # Root component
└── index.tsx                   # Entry point