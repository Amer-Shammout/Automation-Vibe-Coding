# Setup Guide - Automation Vibe Coding

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
REACT_APP_API_URL=http://localhost:3001
NODE_ENV=development
```

### 3. Start Development Server
```bash
npm start
```

The app will open at `http://localhost:3000`

---

## Project Structure Overview

### Core Layers

#### Models (`src/features/*/models/`)
Define data structures and interfaces:
```typescript
export interface IAutomation extends IEntity {
  name: string;
  description: string;
  workflow: IWorkflow;
}
```

#### ViewModels (`src/features/*/viewmodels/`)
Handle business logic and state:
```typescript
export class AutomationViewModel {
  async loadAutomations(): Promise<void> {
    // Orchestrate service calls and state updates
  }
}
```

#### Services (`src/features/*/services/`)
Manage API communication:
```typescript
export class AutomationService {
  async fetchAutomations(): Promise<IAutomation[]> {
    return apiClient.get('/automations');
  }
}
```

#### Views (`src/features/*/views/`)
React components consuming ViewModels via hooks:
```typescript
export const AutomationList = () => {
  const { automations, loadAutomations } = useAutomation();
  // ...
};
```

---

## Understanding the Data Flow

### Component Lifecycle Example

```
1. Component mounts
   ↓
2. Hook (useAutomation) retrieves store data
   ↓
3. useEffect calls hook method (loadAutomations)
   ↓
4. Hook uses ViewModel (AutomationViewModel)
   ↓
5. ViewModel calls Service (AutomationService)
   ↓
6. Service calls API client
   ↓
7. API response updates ViewModel state
   ↓
8. Hook updates global store (Zustand)
   ↓
9. Component re-renders with new data
```

---

## Adding a New Feature

### Example: Creating a "Templates" Feature

#### Step 1: Create Models
**`src/features/templates/models/index.ts`**
```typescript
import { IEntity } from '../../../types';

export interface ITemplate extends IEntity {
  name: string;
  description: string;
  workflow: any;
  tags: string[];
}
```

#### Step 2: Create ViewModel
**`src/features/templates/viewmodels/TemplateViewModel.ts`**
```typescript
export class TemplateViewModel {
  private templates: ITemplate[] = [];

  async loadTemplates(): Promise<void> {
    this.templates = await this.templateService.fetchTemplates();
  }

  getTemplates(): ITemplate[] {
    return this.templates;
  }
}
```

#### Step 3: Create Service
**`src/features/templates/services/TemplateService.ts`**
```typescript
export class TemplateService {
  async fetchTemplates(): Promise<ITemplate[]> {
    return apiClient.get('/templates');
  }
}
```

#### Step 4: Create API Endpoint
**`src/api/endpoints/templateApi.ts`**
```typescript
export const templateApi = {
  list: () => apiClient.get('/templates'),
  get: (id: string) => apiClient.get(`/templates/${id}`),
  // ...
};
```

#### Step 5: Create View Component
**`src/features/templates/views/TemplateList.tsx`**
```typescript
export const TemplateList: React.FC = () => {
  const { templates } = useTemplate();
  return (
    <div>
      {templates.map(t => (
        <div key={t.id}>{t.name}</div>
      ))}
    </div>
  );
};
```

#### Step 6: Create Custom Hook
**`src/hooks/useTemplate.ts`**
```typescript
export const useTemplate = () => {
  const { templates, setTemplates } = useAppStore();
  // Implementation...
  return { templates, /* ... */ };
};
```

---

## API Integration

### Making API Calls

All API calls go through the `apiClient`:

```typescript
// Direct usage (in services)
const automations = await apiClient.get('/automations');

// With query parameters
const response = await apiClient.get('/automations?page=1&size=10');

// POST with data
const newAutomation = await apiClient.post('/automations', {
  name: 'My Automation',
  description: 'Description'
});

// Update
await apiClient.put(`/automations/${id}`, updates);

// Delete
await apiClient.delete(`/automations/${id}`);
```

### Error Handling

The API client automatically handles:
- 401 responses (redirects to login)
- Network errors
- Logging

In components/hooks, wrap API calls in try-catch:
```typescript
try {
  await loadAutomations();
} catch (error) {
  console.error('Failed to load:', error);
  // Show user-friendly error
}
```

---

## State Management

### Zustand Store

Access global state anywhere:
```typescript
import { useAppStore } from './store';

const MyComponent = () => {
  const { automations, setAutomations } = useAppStore();
  // Use state and setters
};
```

### Store Structure
```typescript
interface AppStore {
  // Automation state
  automations: IAutomation[];
  selectedAutomation: IAutomation | null;

  // Workflow state
  workflow: IWorkflow | null;
  selectedNodeId: string | null;

  // UI state
  sidebarOpen: boolean;
  theme: 'light' | 'dark';

  // Actions
  setAutomations: (automations: IAutomation[]) => void;
  // ...
}
```

---

## Styling

### CSS Variables (Theme)
Defined in `src/styles/globals.css`:
```css
:root {
  --primary-color: #007bff;
  --spacing-unit: 8px;
  --border-radius: 4px;
}
```

### Using Variables
```css
.my-element {
  color: var(--primary-color);
  padding: calc(var(--spacing-unit) * 2);
}
```

### Theme Configuration
Configured in `src/styles/theme.ts`:
```typescript
export const theme = {
  colors: { /* ... */ },
  spacing: { /* ... */ },
  // ...
};
```

---

## TypeScript Best Practices

### Type Everything
```typescript
// ✅ Good
interface UserProps {
  name: string;
  age: number;
}

const User: React.FC<UserProps> = ({ name, age }) => {
  // ...
};

// ❌ Avoid
const User = ({ name, age }: any) => {
  // ...
};
```

### Use Union Types for Status
```typescript
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };
```

### Extend Interfaces
```typescript
interface IEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IAutomation extends IEntity {
  name: string;
  // ...
}
```

---

## Utility Functions

### Validation
```typescript
import { validators, validateWorkflow } from '@utils/validation';

if (validators.isEmail(email)) {
  // Valid email
}

const result = validateWorkflow(workflow);
if (result.valid) {
  // Workflow is valid
}
```

### Formatting
```typescript
import { formatters } from '@utils/formatting';

formatters.formatDate(new Date());
formatters.capitalize('hello');
formatters.truncate(text, 50);
```

### Node Helpers
```typescript
import { nodeHelpers } from '@utils/nodeHelpers';

const newNode = nodeHelpers.createNode('action', 'My Node', { x: 0, y: 0 });
const connection = nodeHelpers.createConnection(sourceId, sourcePort, targetId, targetPort);
```

### Logger
```typescript
import { logger } from '@utils/logger';

logger.debug('Debug message', data);
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', error);
```

---

## Development Workflow

### File Naming
- Components: `PascalCase.tsx` (e.g., `AutomationList.tsx`)
- Utilities: `camelCase.ts` (e.g., `validation.ts`)
- Interfaces: Prefix with `I` (e.g., `IAutomation`)

### Import Organization
```typescript
// 1. React/External
import React from 'react';
import { useEffect } from 'react';
import axios from 'axios';

// 2. Internal - Types
import { IAutomation } from './types';

// 3. Internal - Features
import { AutomationViewModel } from './features/automation/viewmodels';

// 4. Internal - Store/Hooks
import { useAppStore } from './store';
import { useAutomation } from './hooks';

// 5. Internal - Components
import { Button } from './components';

// 6. Internal - Utils
import { formatters } from './utils';

// 7. Styles
import './styles.css';
```

### Commit Message Convention
```
feat: Add automation execution history
fix: Resolve node canvas rendering issue
refactor: Extract node validation logic
docs: Update API integration guide
style: Format code with prettier
test: Add automation service tests
chore: Update dependencies
```

---

## Testing Strategy

### Unit Tests (Utilities)
```typescript
// src/utils/__tests__/validation.test.ts
describe('validators', () => {
  it('should validate email correctly', () => {
    expect(validators.isEmail('test@example.com')).toBe(true);
    expect(validators.isEmail('invalid')).toBe(false);
  });
});
```

### Component Tests
```typescript
// src/components/__tests__/Button.test.tsx
describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### Integration Tests
```typescript
// src/features/automation/__tests__/AutomationViewModel.test.ts
describe('AutomationViewModel', () => {
  it('should load automations successfully', async () => {
    const vm = new AutomationViewModel(mockService);
    await vm.loadAutomations();
    expect(vm.getAutomations()).toHaveLength(2);
  });
});
```

---

## Troubleshooting

### API Connection Issues
1. Verify `REACT_APP_API_URL` in `.env`
2. Check if backend server is running
3. Look for CORS errors in browser console
4. Check network tab in DevTools

### TypeScript Errors
1. Run `npm run type-check` to see all errors
2. Verify all imports are correct
3. Check interface definitions
4. Ensure strict mode compliance

### Store Not Updating
1. Verify component is using `useAppStore` correctly
2. Check if setState function is being called
3. Ensure state is immutable (don't mutate directly)
4. Use React DevTools Zustand extension to debug

### Component Not Rendering
1. Check console for errors
2. Verify component is exported correctly
3. Ensure props match interface definitions
4. Check parent component passes required props

---

## Performance Tips

### Memoization
```typescript
const MyComponent = React.memo(({ data }: Props) => {
  // Component only re-renders if data changes
});

const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

### Code Splitting
```typescript
const AutomationEditor = lazy(() => import('./features/automation/views/Editor'));

// In component
<Suspense fallback={<Loading />}>
  <AutomationEditor />
</Suspense>
```

### Efficient State Updates
```typescript
// ✅ Good - Only update what changed
setAutomations([...automations, newAutomation]);

// ❌ Avoid - Unnecessary re-renders
automations.push(newAutomation);
setAutomations(automations);
```

---

## Additional Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Axios Documentation](https://axios-http.com/docs/intro)

---

## Support & Feedback

For questions or improvements:
1. Check existing code patterns
2. Review similar features
3. Consult utility functions
4. Look at test examples

Happy coding! 🚀
