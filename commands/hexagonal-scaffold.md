---
description: Internal operation invoked by /hexagonal during greenfield scaffolding. Creates the service folder layout and the master README. Not user-invoked directly.
allowed-tools: "Write Bash"
---

# <span style="color:#76a039">Hexagonal Scaffold Operation</span>

Creates a Hexagonal Architecture folder layout for a new service and writes a master `README.md` documenting the pattern in the selected language's idiomatic style.

This skill is invoked by `/hexagonal` during the greenfield flow. It is not intended for direct user invocation — the core skill resolves all inputs (service name, language, destination, style notes) before calling this one.

---

## <span style="color:#76a039">Inputs (provided by caller)</span>

- `serviceName` — string, e.g. `payments`
- `language` — `node` or `python`
- `destination` — absolute or project-relative path, e.g. `src/payments/` or `payments/`
- `styleNotes` — string of extracted conventions to bake into the README; may be empty

If any input is missing or invalid, halt and report the issue to the caller. Do not prompt the user (the core skill is responsible for prompts).

---

## <span style="color:#76a039">What It Produces</span>

```
<destination>/
  controllers/           ← driving adapters (HTTP, CLI, events)
  use-cases/             ← application logic
  repositories/          ← ports for persistence/external data
  data/                  ← driven adapters (DB, AI SDKs, external APIs)
  README.md              ← master pattern documentation
```

No `domain/` folder. No code files. No framework boilerplate. The README is the only file; the user fills in the implementation.

---

## <span style="color:#76a039">Procedure</span>

### <span style="color:#76a039">Step 1 — Verify destination</span>

- If `<destination>` exists and is non-empty → halt with: 🟤 *"Destination `<destination>` already exists and contains files. Pick a different name or remove the existing directory first."*
- If `<destination>` does not exist → create it.

### <span style="color:#76a039">Step 2 — Create the four layer folders</span>

Create empty directories (no placeholder files, no `.gitkeep` — keep it clean):

```bash
mkdir -p <destination>/controllers
mkdir -p <destination>/use-cases
mkdir -p <destination>/repositories
mkdir -p <destination>/data
```

Use the `Bash` tool for the `mkdir -p` calls.

### <span style="color:#76a039">Step 3 — Write the master README</span>

Write `<destination>/README.md` using the template below, substituting `<service-name>` and inserting the language-specific pseudocode block. If `styleNotes` is non-empty, append a "Style Conventions (from reference codebase)" section at the bottom.

#### <span style="color:#76a039">README template (both languages share the structure)</span>

```markdown
# <service-name>

Service built using Hexagonal Architecture. This README documents the layer rules and shows idiomatic patterns. Each layer has a dedicated folder; cross-layer rules are enforced by the `/hexagonal` skill.

---

## Layers

### `controllers/`
**Driving adapters.** Translate external input (HTTP, CLI, events) into plain objects and pass to use cases.

- **MUST NOT** contain business logic.
- **MUST NOT** call repositories or data adapters directly.

### `use-cases/`
**Application logic.** Orchestrates repositories and data adapters. One use case per business operation, one file per use case.

- **MUST NOT** perform I/O of its own.
- **MUST** receive its dependencies (repositories, adapters) as parameters.

### `repositories/`
**Ports for persistence/external data.** Accept a data adapter as a dependency. Translate between the use case's world and the data adapter's world.

- **MUST NOT** contain business logic.
- **MUST NOT** contain retry logic, model fallback strategy, or orchestration across multiple data calls — those belong in the use case.
- **MUST NOT** know anything about HTTP or framework concerns.

### `data/`
**Driven adapters.** Wrap external APIs, databases, AI SDKs. The only place where external-service details (endpoints, schemas, library types) live.

- **MUST** be the single concentration point for any external dependency.

### `domain/` (not present — add only when needed)
Only introduce a `domain/` folder when logic is genuinely duplicated across 2+ modules and can be grouped under a well-named entity with like responsibilities. **Do not create it speculatively.**

---

## Dependency Flow

```
controllers/  →  use-cases/  →  repositories/  →  data/
```

Each arrow means "depends on (calls into)". Nothing flows backward. Use cases never know about controllers; repositories never know about use cases; data adapters never know about repositories.

---

## Pseudocode

<LANGUAGE-SPECIFIC-PSEUDOCODE-GOES-HERE>

---

<OPTIONAL-STYLE-NOTES-SECTION>
```

#### <span style="color:#76a039">Node.js pseudocode block</span>

When `language === "node"`, insert this where `<LANGUAGE-SPECIFIC-PSEUDOCODE-GOES-HERE>` appears:

````markdown
### Data adapter (driven)

```ts
// data/paymentGateway.ts
export const paymentGateway = ({ httpClient }: { httpClient: HttpClient }) => {
  const charge = async (amount: number, token: string): Promise<ChargeResult> => {
    return httpClient.post('/charges', { amount, token });
  };

  return { charge };
};
```

### Repository (port)

```ts
// repositories/paymentRepository.ts
export const paymentRepository = ({ paymentGateway }: { paymentGateway: PaymentGateway }) => {
  const recordCharge = async (amount: number, token: string): Promise<Charge> => {
    const result = await paymentGateway.charge(amount, token);
    return { id: result.id, amount, status: result.status };
  };

  return { recordCharge };
};
```

### Use case (application logic)

```ts
// use-cases/processOrder.ts
export const processOrder = ({ paymentRepository }: { paymentRepository: PaymentRepository }) => {
  const placeOrder = async (orderInput: OrderInput): Promise<Order> => {
    const charge = await paymentRepository.recordCharge(orderInput.total, orderInput.token);
    return { id: charge.id, total: orderInput.total };
  };

  return { placeOrder };
};
```

### Controller (driving adapter)

```ts
// controllers/orderController.ts
export const orderController = ({ processOrder }: { processOrder: ProcessOrder }) => {
  const handlePostOrder = async (req: Request, res: Response): Promise<void> => {
    const order = await processOrder.placeOrder(req.body);
    res.status(201).json(order);
  };

  return { handlePostOrder };
};
```

### Style rules baked into these examples

- **JS Module Pattern**: each module is a factory closure that returns an object of named methods.
- **No `create` prefix** on factory functions (`paymentRepository`, not `createPaymentRepository`).
- **No generic `execute()`** — methods are named for what they do (`placeOrder`, `recordCharge`).
- **camelCase** for file names and identifiers.
- **TypeScript types** on all public-facing function signatures.
````

#### <span style="color:#76a039">Python pseudocode block</span>

When `language === "python"`, insert this where `<LANGUAGE-SPECIFIC-PSEUDOCODE-GOES-HERE>` appears:

````markdown
### Data adapter (driven)

```python
# <span style="color:#76a039">data/payment_gateway.py</span>
from typing import TypedDict

class ChargeResult(TypedDict):
    id: str
    status: str

def charge(amount: int, token: str, http_client) -> ChargeResult:
    return http_client.post("/charges", {"amount": amount, "token": token})
```

### Repository (port)

```python
# <span style="color:#76a039">repositories/payment_repository.py</span>
from typing import TypedDict
from data import payment_gateway

class Charge(TypedDict):
    id: str
    amount: int
    status: str

def record_charge(amount: int, token: str, http_client) -> Charge:
    result = payment_gateway.charge(amount, token, http_client)
    return {"id": result["id"], "amount": amount, "status": result["status"]}
```

### Use case (application logic)

```python
# <span style="color:#76a039">use_cases/process_order.py</span>
from typing import TypedDict
from repositories import payment_repository

class OrderInput(TypedDict):
    total: int
    token: str

class Order(TypedDict):
    id: str
    total: int

def place_order(order_input: OrderInput, http_client) -> Order:
    charge = payment_repository.record_charge(
        order_input["total"], order_input["token"], http_client
    )
    return {"id": charge["id"], "total": order_input["total"]}
```

### Controller (driving adapter)

```python
# <span style="color:#76a039">controllers/order_controller.py</span>
from use_cases import process_order

def handle_post_order(request, http_client):
    order = process_order.place_order(request.json, http_client)
    return {"status": 201, "body": order}
```

### Style rules baked into these examples

- **Module-level functions** — no unnecessary classes. The module itself is the encapsulation unit.
- **Dependencies as parameters** — `http_client` is passed in, never imported as a global.
- **snake_case** for file names and identifiers.
- **Type hints** on all public-facing function signatures.
````

#### <span style="color:#76a039">Optional style-notes section</span>

If `styleNotes` is non-empty, append this section to the end of the README (replacing `<OPTIONAL-STYLE-NOTES-SECTION>`):

```markdown
## Style Conventions (from reference codebase)

The following conventions were extracted from the reference codebase and apply alongside the base rules above:

<insert styleNotes verbatim>
```

If `styleNotes` is empty, omit the heading entirely (delete the `<OPTIONAL-STYLE-NOTES-SECTION>` placeholder line).

### <span style="color:#76a039">Step 4 — Report back to the caller</span>

Print:
```
Created scaffold at <destination>/:
  - controllers/
  - use-cases/
  - repositories/
  - data/
  - README.md (<bytes> bytes, <language> pseudocode)
```

The caller (`/hexagonal`) is responsible for any user-facing success message beyond this report.

---

## <span style="color:#76a039">Error Handling</span>

- **Destination exists and is non-empty** → halt with the exact message from Step 1. Do not partially populate.
- **`mkdir -p` fails** → halt and surface the underlying error.
- **`README.md` write fails after folders were created** → leave the folders in place but halt and report the write error. Caller can clean up.
