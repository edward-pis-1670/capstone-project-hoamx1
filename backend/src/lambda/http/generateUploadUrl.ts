import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { createAttachmentPresignedUrl } from '../../businessLogic/todos'
import { getUserId } from '../utils'

const s3Bucket = process.env.ATTACHMENT_S3_BUCKET;

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    if (!todoId || !todoId.length) {
      return {
        statusCode: 400,
        body: JSON.stringify({})
      }
    }
    const userId = getUserId(event);
    const attachmentUrl = `https://${s3Bucket}.s3.amazonaws.com/${todoId}`
    const uploadUrl = await createAttachmentPresignedUrl(userId, todoId, attachmentUrl)
    return {
      statusCode: 201,
      body: JSON.stringify({
        uploadUrl
      })
    }
  }
)

handler
.use(httpErrorHandler())
.use(
  cors({
    credentials: true
  })
)
