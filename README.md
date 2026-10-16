# QuickNotes

QuickNotes is a learning project demonstrating a browser API client using `fetch`, async/await, input validation, and design documents for a production-style notes service.

## Project structure

```text
quicknotes/
├── index.html
├── api.js
├── style.css
├── README.md
└── docs/
    ├── api-design.md
    ├── data-model.md
    └── architecture.md
```

## How to run the API client

1. Open this folder in your code editor.
2. Start a local development server (for example, VS Code Live Server) and open `index.html` through it.
3. Click **Load notes** to request up to 10 sample posts from `https://jsonplaceholder.typicode.com/posts?_limit=10`.
4. Enter a title (required, maximum 100 characters) and optional body, then click **Create note**.

5. Click a note's **Delete** button to test the DELETE request , check if it works.

Your browser needs internet access to call JSONPlaceholder. JSONPlaceholder simulates POST and DELETE; it does not permanently change its sample dataset. A created note is kept in the current page's JavaScript array and disappears after refreshing or loading the server data again.

## Design documents

- [REST API design](docs/api-design.md)
- [Data model](docs/data-model.md)
- [Architecture and scaling plan](docs/architecture.md)

## What I learned

- How `fetch`, async/await, reusable request functions, and try/catch/finally handle API requests.
- How to validate form input, display loading/success/error/empty states, and disable buttons during requests.
- How REST endpoints use HTTP methods and status codes to represent operations and outcomes.
- How primary keys, foreign keys, join tables, and indexes model relational data.
- How caching, load balancing, read replicas, queues, and workers help a service scale.
- Why simulated API writes differ from persistent writes to a real backend database.
