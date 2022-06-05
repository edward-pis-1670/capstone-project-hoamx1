import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { createLogger } from '../utils/logger'

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('todosStorage')

export class TodosStorage {
  constructor(
    private readonly s3 = new XAWS.S3({ signatureVersion: 'v4' }),
    private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET,
    private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION
  ) {}

  async deleteObject(todoId: string) {
    logger.warn('Delete an object in bucket')

    await this.s3
      .deleteObject({
        Bucket: this.bucketName,
        Key: todoId
      })
      .promise()
  }

  async createPresignedUrl(todoId: string) {
    return this.s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: todoId,
      Expires: +this.urlExpiration
    })
  }
}
