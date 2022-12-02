const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initialilzeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};
initialilzeDBAndServer();

const todosWithStatusTodo = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const highPriorityTodos = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const getPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const todosWithPlayText = (requestQuery) => {
  return requestQuery.search_q;
};

// API 1

app.get("/todos/", async (request, response) => {
  const { id, todo, priority, status, search_q = "" } = request.query;

  let data = null;
  let getAllTodos = "";

  if (todosWithStatusTodo(request.query)) {
    getAllTodos = `
      SELECT
        *
      FROM
        todo
      WHERE
        status
            LIKE '${status}'
      `;
  } else if (highPriorityTodos(request.query)) {
    getAllTodos = `
    SELECT 
        * 
    FROM 
        todo 
    WHERE 
        priority 
            LIKE '${priority}'`;
  } else if (getPriorityAndStatus(request.query)) {
    getAllTodos = `
    SELECT
        *
    FROM
        todo
    WHERE
        priority
            LIKE '${priority}' AND status = '${status};'
    `;
  } else if (todosWithPlayText(request.query)) {
    getAllTodos = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }
  data = await db.all(getAllTodos);
  response.send(data);
});

// API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodo = `
  SELECT
    *
  FROM
    todo
  WHERE
    id = ${todoId};
  `;
  const getTodoQuery = await db.get(getTodo);
  response.send(getTodoQuery);
});

// API 3

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const updateQuery = `
  INSERT INTO 
    todo (id, todo, priority, status)
  VALUES
    (${id}, '${todo}', '${priority}', '${status}')
  `;
  await db.run(updateQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { id, todo, priority, status } = request.body;

  let updateColumn = "";

  if (todo !== undefined) {
    updateColumn = "Todo";
  } else if (priority !== undefined) {
    updateColumn = "Priority";
  } else if (status !== undefined) {
    updateColumn = "Status";
  }

  const updatedQuery = `
  UPDATE
    todo
  SET
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}'
  `;
  await db.run(updatedQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};
  `;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
