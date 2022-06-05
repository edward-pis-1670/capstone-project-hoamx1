import * as uuid from 'uuid'
import { TodosAccess } from '../dataLayer/todosAccess'
import { TodosStorage } from '../fileStorage/todosStorage'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { createLogger } from '../utils/logger'

const todoAccess = new TodosAccess()
const s3Storage = new TodosStorage()

const logger = createLogger('TodosAccess')

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
  logger.info(`Getting all todos for userId = ${userId}`)
  const todos = await todoAccess.getAllTodos(userId)

  if (!todos.length) {
    logger.info('This user has no any todos!')
  }
  return todos
}

export async function createTodo(
  userId: string,
  createTodoRequest: CreateTodoRequest
): Promise<TodoItem> {
  logger.info(`Create a new todo for userId = ${userId}`)
  const itemId = uuid.v4()

  const newTodo = await todoAccess.createTodo({
    todoId: itemId,
    name: createTodoRequest.name,
    done: false,
    createdAt: new Date().toISOString(),
    dueDate: createTodoRequest.dueDate,
    attachmentUrl: '',
    userId: userId,
    ...createTodoRequest
  })
  return newTodo
}

export async function deleteTodo(userId: string, todoId: string) {
    logger.warn(`Delete todoId = ${todoId}`)

  if (!todoId) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `Please provide a specific todoId!`
      })
    }    
  }
  const isValidTodoId = await todoAccess.getTodoById(userId, todoId)

  if (!isValidTodoId.length) {
    logger.error(`TodoId = ${todoId} not found!`)
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: `TodoId = ${todoId} not found!`
      })
    }
  }
  return await todoAccess.deleteTodo(userId, todoId)
}

export async function updateTodo(
  userId: string,
  todoId: string,
  todoItem: TodoUpdate
) {
    logger.info(`Update todo for userId = ${userId}`)
  const isValidTodoId = await todoAccess.getTodoById(userId, todoId)

  if (!isValidTodoId.length) {
    logger.error(`TodoId = ${todoId} not found!`)
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: `TodoId = ${todoId} not found!`
      })
    }
  }

  return await todoAccess.updateTodo(userId, todoId, todoItem)
}

export async function createAttachmentPresignedUrl(
  userId: string,
  todoId: string,
  attachmentUrl: string
) {
    logger.info(`Generate a new upload url for userId = ${userId}`)
  const isValidTodoId = await todoAccess.getTodoById(userId, todoId)

  if (!isValidTodoId.length) {
    logger.error(`TodoId = ${todoId} not found!`)
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: `TodoId = ${todoId} not found!`
      })
    }
  }

  await todoAccess.updateAttachmentUrl(userId, todoId, attachmentUrl)

  return await s3Storage.createPresignedUrl(todoId)
}
