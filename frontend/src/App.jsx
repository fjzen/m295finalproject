import { useEffect, useState } from 'react'
import './App.css'
import {
  getTasks,
  assignTask,
  completeTask,
  invoiceTask
} from './api.js'

function App() {
  const [tasks, setTasks] = useState([])

  // Wait for tasks to load, then set them.
  async function load() {
    const data = await getTasks();
    setTasks(data);
  }


  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    load();
  }, []);

  return (
    <div style={{ padding: 20}}>
      <h1>Tasks</h1>

      <button onClick={load}>Reload</button>

      <ul>
        {tasks.map(task => (
          <li key={task.id} style={{ marginBottom: 10 }}>
            <b>{task.description}</b><br />
            Status: {task.status}<br />
            Customer: {task.customer}<br />
            Employee: {task.employee ?? "—"}<br />

            <button onClick={async () => {
              await assignTask(task.id, 1);
              load();
            }}>
              Assign
            </button>

            <button onClick={async () => {
              await completeTask(task.id);
              load();
            }}>
              Complete
            </button>

            <button onClick={async () => {
              await invoiceTask(task.id);
              load();
            }}>
              Complete
            </button>

            <button onClick={async () => {
              await invoiceTask(task.id);
              load();
            }}>
              Invoice
            </button>
          </li>
        ))}
      </ul>
    </div>
    
  )
}

export default App
