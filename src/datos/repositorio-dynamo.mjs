import { crearRepositorio } from './repositorio.mjs';

// Tabla DynamoDB. El SDK se importa solo aquí y en tiempo de ejecución (viene en Lambda).
export async function crearTablaDynamo({ nombre }) {
  const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
  const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } = await import('@aws-sdk/lib-dynamodb');
  const cliente = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
    marshallOptions: { removeUndefinedValues: true },
  });
  return {
    async get(clave) {
      const r = await cliente.send(new GetCommand({ TableName: nombre, Key: clave }));
      return r.Item ?? null;
    },
    async put(item, { siNoExiste = false } = {}) {
      try {
        await cliente.send(
          new PutCommand({
            TableName: nombre,
            Item: item,
            ...(siNoExiste ? { ConditionExpression: 'attribute_not_exists(pk)' } : {}),
          }),
        );
        return true;
      } catch (e) {
        if (e?.name === 'ConditionalCheckFailedException') return false;
        throw e;
      }
    },
    async query({ pk, skDesde, descendente = false, limite }) {
      const r = await cliente.send(
        new QueryCommand({
          TableName: nombre,
          KeyConditionExpression: skDesde === undefined ? 'pk = :pk' : 'pk = :pk AND sk >= :desde',
          ExpressionAttributeValues: skDesde === undefined ? { ':pk': pk } : { ':pk': pk, ':desde': skDesde },
          ScanIndexForward: !descendente,
          ...(limite ? { Limit: limite } : {}),
        }),
      );
      return r.Items ?? [];
    },
  };
}

export async function crearRepositorioDynamo({ tabla }) {
  return crearRepositorio({ tabla });
}
