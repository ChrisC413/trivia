const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE;

const sendToClient = async (connectionId, data) => {
  const endpoint = process.env.WEBSOCKET_ENDPOINT;
  const client = new WebSocketClient({ endpoint });
  
  await client.send({
    ConnectionId: connectionId,
    Data: JSON.stringify(data)
  });
};

const sendToRoom = async (roomId, data) => {
  const room = await getRoom(roomId);
  if (!room) return;

  const promises = room.players.map(player => 
    sendToClient(player.id, data)
  );
  
  await Promise.all(promises);
};

const getRoom = async (roomId) => {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: { roomId }
  });
  
  const result = await docClient.send(command);
  return result.Item;
};

const saveRoom = async (room) => {
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: room
  });
  
  await docClient.send(command);
};

const updateRoom = async (roomId, updates) => {
  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { roomId },
    UpdateExpression: updates.expression,
    ExpressionAttributeValues: updates.values,
    ExpressionAttributeNames: updates.names
  });
  
  await docClient.send(command);
};

const deleteRoom = async (roomId) => {
  const command = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { roomId }
  });
  
  await docClient.send(command);
};

module.exports = {
  sendToClient,
  sendToRoom,
  getRoom,
  saveRoom,
  updateRoom,
  deleteRoom
}; 