import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from app.core.config import settings

s3_config = Config(
    s3={'addressing_style': 'path'} if settings.S3_FORCE_PATH_STYLE else {},
    signature_version='s3v4'
)

s3_client = boto3.client(
    's3',
    endpoint_url=settings.S3_ENDPOINT,
    aws_access_key_id=settings.S3_ACCESS_KEY,
    aws_secret_access_key=settings.S3_SECRET_KEY,
    region_name=settings.S3_REGION,
    config=s3_config
)

def ensure_bucket_exists():
    try:
        s3_client.head_bucket(Bucket=settings.S3_BUCKET)
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code')
        if error_code in ('404', 'NoSuchBucket', 'NotFound'):
            try:
                s3_client.create_bucket(Bucket=settings.S3_BUCKET)
            except Exception as create_err:
                print(f"Failed to create bucket: {create_err}")
        else:
            print(f"S3 head_bucket error: {e}")
    except Exception as e:
        print(f"Error checking bucket: {e}")

def upload_file(file_bytes: bytes, storage_key: str, content_type: str):
    s3_client.put_object(
        Bucket=settings.S3_BUCKET,
        Key=storage_key,
        Body=file_bytes,
        ContentType=content_type
    )

def generate_presigned_url(storage_key: str, expires_in: int = 86400) -> str:
    try:
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': settings.S3_BUCKET, 'Key': storage_key},
            ExpiresIn=expires_in
        )
        return url
    except Exception as e:
        print(f"Error generating presigned url: {e}")
        return ""

def get_object(storage_key: str):
    return s3_client.get_object(Bucket=settings.S3_BUCKET, Key=storage_key)
