import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as AWSXRay from 'aws-xray-sdk'
import { TodoItem } from '../models/TodoItem'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const XAWS = AWSXRay.captureAWS(AWS)

export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly todosTable = process.env.TODOS_TABLE
  ) {}

  async getAllTodos(userId: string): Promise<TodoItem[]> {
    const todos = await this.docClient
      .query({
        TableName: this.todosTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
      .promise()
    const items = todos.Items
    return items as TodoItem[]
  }

  async createTodo(todo: TodoItem): Promise<TodoItem> {
    await this.docClient
      .put({
        TableName: this.todosTable,
        Item: todo
      })
      .promise()

    return todo
  }

  async getTodoById(userId: string, todoId: string) {
    const isValidTodoId = await this.docClient
      .query({
        TableName: this.todosTable,
        KeyConditionExpression: 'userId = :userId AND todoId = :todoId',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':todoId': todoId
        }
      })
      .promise()
    const item = isValidTodoId.Items
    return item
  }
  async deleteTodo(userId: string, todoId: string) {
    await this.docClient.delete({
      TableName: this.todosTable,
      Key: {
        userId,
        todoId
      }
    }).promise()
  }

  async updateTodo(
    userId: string,
    todoId: string,
    todoItem: UpdateTodoRequest
  ) {
    await this.docClient
      .update({
        TableName: this.todosTable,
        Key: {
          userId,
          todoId
        },
        ExpressionAttributeNames: {
          '#name': 'name',
          '#dueDate': 'dueDate',
          '#done': 'done'
        },
        UpdateExpression: 'set #name =:name, #dueDate=:dueDate, #done=:done',
        ExpressionAttributeValues: {
          ':name': todoItem.name,
          ':dueDate': todoItem.dueDate,
          ':done': todoItem.done
        }
      })
      .promise()
  }

  async updateAttachmentUrl(
    userId: string,
    todoId: string,
    newAttachmentUrl: string
  ) {
    await this.docClient
      .update({
        TableName: this.todosTable,
        Key: {
          userId,
          todoId
        },
        ExpressionAttributeNames: { '#attachmentUrl': 'attachmentUrl' },
        UpdateExpression: 'set #attachmentUrl =:attachmentUrl',
        ExpressionAttributeValues: {
          ':attachmentUrl': newAttachmentUrl
        }
      })
      .promise()
  }
}
