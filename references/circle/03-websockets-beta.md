# Websockets (Beta)

Websockets are a crucial part of any real-time feature. On our case, we're talking about Chat and Notifications.

## WebSockets Connection Test

This guide explains how to test WebSockets connection with Circle's real-time messaging system using the `ws` library.

### Basic Setup

Create a WebSocket connection to Circle's server:

```javascript
const WebSocket = require("ws");

const channelName = "ChatRoomChannel"; // Use required channel name

const socket = new WebSocket("wss://app.circle.so/cable", {
  headers: {
    Origin: "https://your-whitelisted-domain.com",
    Authorization: "Bearer HEADLESS_MEMBER_ACCESS_TOKEN"
  }
});
```

{% hint style="info" %}

* The WebSocket URL `wss://app.circle.so/cable` is Circle's specific endpoint.
* Origin should be one of the whitelisted domains added for the community.
* Replace `HEADLESS_MEMBER_ACCESS_TOKEN` with your actual access token.
* Please note that the HEADLESS\_MEMBER\_ACCESS\_TOKEN expires after 1 hour and need to be refreshed.
  {% endhint %}

### Event Handling

#### 1. Connection Open

Handle the connection establishment and channel subscription:

```javascript
socket.on("open", function open() {
  console.log("WebSocket connection opened.");
  
  // Subscribe to the chat channel
  const subscribeMessage = JSON.stringify({
    command: "subscribe",
    identifier: JSON.stringify({
      channel: channelName,
      community_member_id: COMMUNITY_MEMBER_ID
    })
  });
  
  // Send subscription request
  socket.send(subscribeMessage);
  
  // Optional: Send a test message
  socket.send(JSON.stringify({ 
    action: "message", 
    data: "Hello Server!" 
  }));
});
```

{% hint style="info" %}
Make sure to replace the following variables with your actual values:

* COMMUNITY\_MEMBER\_ID: Community member ID who owns the Headless access token.
  {% endhint %}

#### 2. Receiving Messages

Handle incoming messages from the server:

```javascript
socket.on("message", function incoming(data) {
  const message = JSON.parse(data);
  
  if (message.channel === channelName) {
    console.log(`Message from channel ${channelName}:`, message.data);
  } else {
    console.log("Message from server:", message);
  }
});
```

#### 3. Error Handling

Implement error handling for the WebSocket connection:

```javascript
socket.on("error", function error(err) {
  console.error("WebSocket error:", err);
});
```

#### 4. Connection Close

Handle connection closure:

```javascript
socket.on("close", function close() {
  console.log("WebSocket connection closed.");
});
```

### Complete Implementation

Here's the complete code combining all the components:

<pre class="language-javascript"><code class="lang-javascript"><strong>const WebSocket = require("ws");
</strong>const channelName = "ChatRoomChannel";

function initializeWebSocket() {
  const socket = new WebSocket("wss://app.circle.so/cable", {
    headers: {
      Origin: "https://your-whitelisted-domain.com",
      Authorization: "Bearer HEADLESS_MEMBER_ACCESS_TOKEN"
    }
  });

  // Handle connection open
  socket.on("open", function open() {
    console.log("WebSocket connection opened.");
    
    // Subscribe to channel
    const subscribeMessage = JSON.stringify({
      command: "subscribe",
      identifier: JSON.stringify({
        channel: channelName,
        community_member_id: COMMUNITY_MEMBER_ID
      })
    });
    
    socket.send(subscribeMessage);
  });

  // Handle incoming messages
  socket.on("message", function incoming(data) {
    const message = JSON.parse(data);
    if (message.channel === channelName) {
      console.log(`Message from channel ${channelName}:`, message.data);
    } else {
      console.log("Message from server:", message);
    }
  });

  // Handle errors
  socket.on("error", function error(err) {
    console.error("WebSocket error:", err);
  });

  // Handle connection close
  socket.on("close", function close() {
    console.log("WebSocket connection closed.");
    // Optional: Implement reconnection logic here
  });

  return socket;
}

// Initialize the WebSocket connection
const socket = initializeWebSocket();
</code></pre>

### Run Test

```bash
$ node websocket-connection-test.js
```

On successful connection, you will start receiving `ping` from server.&#x20;

Example:

```bash
WebSocket connection opened.
Message from server: { type: 'welcome', sid: 'JnehncGjAQuLBIBoImSMk' }
Message from server: {
  identifier: '{"channel":"ChatRoomChannel","community_member_id": COMMUNITY_MEMBER_ID}',
  type: 'confirm_subscription'
}
Message from server: { type: 'ping', message: 1729855056 }
Message from server: { type: 'ping', message: 1729855059 }
Message from server: { type: 'ping', message: 1729855062 }
```

## Notifications

Name: `*NotificationChannel*`

Pubsub queue: "**notification-channel-#{*****community\_member\_id*****}"**

This channel is used for communication of all real time notifications for a community member. This channel receives following events:

* `newNotification`
  * This event is received whenever community member receives a new in-app notification
* `updateNewNotificationCount`
  * This event is received whenever there is change in community member’s in-app notification count
  * Additional information received with the event:

    ```typescript
    new_notifications_count: number
    ```
* `resetNewNotificationCount`
  * This event is received to mark all notifications as read.
  * Additional information received with the event:

    ```typescript
    new_notifications_count: 0
    ```

## Chat

We have 3 channels to manage websocket communications for messaging.

[👉 chat-room-channel-#{community\_member.id}](#chat-room-channel-community_member.id)

👉 [chat-room-#{chat\_room.id}-channel](#chat-room-chat_room.id-channel)

👉 [chat-community-member-#{community\_member\_id}-threads-channel](#chat-community-member-community_member_id-threads-channel)

#### chat-room-channel-#{community\_member.id}

This channel receives all updates regarding messaging which are specific to a member, all other events from a room which are common for all members are communicated on [chat room channel](https://www.notion.so/80e767bb79a34c09a0d1524c0faf1dea?pvs=21).

#### **Channel details:**

Name: `*ChatRoomChannel*`

Pubsub queue: chat-room-channel-#{community\_member.id}

#### **Events:**

**Chat Room events:**

`chatRoomCreated`

1. This event is broadcasted on a non embedded chat room creation.
2. Additional information received with the event

```typescript
interface ChatRoom {
  id: number;
  uuid: string;
  identifier: string;
  unread_messages_count: number;
  chat_room_kind: string;
  chat_room_name: string;
  chat_room_description: string;
  chat_room_show_history: boolean;
  other_participants_preview: Record<string, any>[];
  current_participant: Record<string, any>;
  last_message: Record<string, any>;
}
```

`chatRoomUpdated`

1. This event gets broadcasted in following cases:
   1. when non embedded chat room name is changed.
   2. when non embedded chat room gets pinned.
2. Please note that same event is broadcasted on `chat-room-#{chat_room.id}-channel` channel on updating room specific attributes like `:pinned_message_id, :show_history, :description, :name` attributes.
3. Additional information received with the event:

   ```typescript
   interface SimplifiedChatRoom {
     uuid: string;
     chat_room_name: string;
     chat_room_description: string;
     chat_room_show_history: boolean;
     pinned_message: Record<string, any>;
   }
   ```

`chatRoomDeleted`

1. This event gets broadcasted on chat room deletion.
2. Additional information received with the event:

   ```typescript
   {
     chat_room_uuid: string
   }
   ```

`chatRoomRead`

1. This event gets broadcasted when chatroom gets marked as read by a participant.
2. Additional information received with the event:

```typescript
{
  chat_room_uuid: string
}
```

`chatRoomPinned`

1. This event gets broadcasted when a non embedded chat room is pinned by a community member.
2. Additional information received with the event:

```typescript
{
  chat_room_id: number
  pinned_at: string
}
```

`chatRoomUnPinned`

1. This event gets broadcasted when a non embedded chat room is un-pinned by a community member.
2. Additional information received with the event:

```typescript
{
  chat_room_id: number
}
```

**ChatRoomMessage events:**

`newMessage`

* This event gets broadcasted for each new non reply message in a non embedded chat room.
* Additional information received with the event:<br>

  ```typescript
  interface JSONMessage {
    id: number;
    chat_room_uuid: string;
    chat_room_kind: string;
    chat_room_participant_id: number; // Assuming this is a number based on previous examples
    body: string;
    rich_text_body: Record<string, any>;
    sent_at: string;
    created_at: string;
    sender: Record<string, any>;
    creation_uuid: string;
    chat_thread_id: number;
    parent_message_id: number;
    lesson_id: number;
    edited_at: string;
    replies_count: number;
    total_thread_participants_count: number;
    thread_participants_preview: Record<string, any>;
    chat_thread_replies_count: number;
  }
  ```
* Note: We are [broadcasting exact same event](https://www.notion.so/Websockets-b0f1bd026bcd41dd833d04f8a036df63?pvs=21) on chat-room-#{chat\_room.id}-channel currently for all new messages including replies. This is sent for all embedded and non embedded rooms.

#### chat-room-#{chat\_room.id}-channel

We are using this channel to post chat room events which are not intended for a specific community member.

#### **Channel details:**

Name: `*Chats*::*RoomChannel*`

Pubsub queue: `chat-room-#{*chat_room*.id}-channel`

#### **Events:**

**ChatRoomMessage events:**

`newMessage`

* This event gets broadcasted for each new message in the chat room
* Additional information received with the event:

```typescript
interface JSONMessage {
  id: number;
  chat_room_uuid: string;
  chat_room_kind: string;
  chat_room_participant_id: number; // Assuming this is a number based on previous examples
  body: string;
  rich_text_body: Record<string, any>;
  sent_at: string;
  created_at: string;
  sender: Record<string, any>;
  creation_uuid: string;
  chat_thread_id: number;
  parent_message_id: number;
  lesson_id: number;
  edited_at: string;
  replies_count: number;
  total_thread_participants_count: number;
  thread_participants_preview: Record<string, any>;
  chat_thread_replies_count: number;
}
```

`deletedMessage`

* This event gets broadcasted when a message gets deleted from the chat room
* Additional information received with the event:<br>

  ```typescript
  interface ParentMessage {
    id: number;
    chat_room_uuid: string;
    chat_room_participant_id: number; // Assuming this is a number based on previous examples
    body: string;
    rich_text_body: Record<string, any>;
    sent_at: string;
    created_at: string;
    sender: Record<string, any>;
    creation_uuid: string;
    chat_thread_id: number;
    parent_message_id: number;
    lesson_id: number;
    edited_at: string;
    replies_count: number;
    total_thread_participants_count: number;
    thread_participants_preview: Record<string, any>;
  }

  interface MessageWithParent {
    id: number;
    parent_message: ParentMessage;
  }
  ```

`updatedMessage`

* This event gets broadcasted when a message is updated
* Additional information received with the event:

```typescript
interface JSONMessage {
  id: number;
  chat_room_uuid: string;
  chat_room_participant_id: number; // Assuming this is a number based on previous examples
  body: string;
  rich_text_body: Record<string, any>;
  sent_at: string;
  created_at: string;
  sender: Record<string, any>;
  creation_uuid: string;
  chat_thread_id: number;
  parent_message_id: number;
  lesson_id: number;
  edited_at: string;
  replies_count: number;
  total_thread_participants_count: number;
  thread_participants_preview: Record<string, any>;
}
```

#### chat-community-member-#{community\_member\_id}-threads-channel

We are using this channel to communicate events for the threads that a community is part of

#### **Channel details:**

Name: `*Chats*::*CommunityMemberThreadsChannel*`

Pubsub queue: `chat-community-member-#{community_member_id}-threads-channel`

`newMessage`

1. This event gets broadcasted for each new message in the chat thread.
2. Additional information received with the event:

```typescript
interface JSONMessage {
  id: number;
  chat_room_uuid: string;
  chat_room_kind: string;
  chat_room_participant_id: number; // Assuming this is a number based on previous examples
  body: string;
  rich_text_body: Record<string, any>;
  sent_at: string;
  created_at: string;
  sender: Record<string, any>;
  creation_uuid: string;
  chat_thread_id: number;
  parent_message_id: number;
  lesson_id: number;
  edited_at: string;
  replies_count: number;
  total_thread_participants_count: number;
  thread_participants_preview: Record<string, any>;
  chat_thread_replies_count: number;
}
```

`updatedMessage`

1. This event gets broadcasted when a message is updated in chat thread
2. Additional information received with the event:

```typescript
interface ChatMessage {
  id: number;
  chat_room_uuid: string;
  chat_room_participant_id: number; // Assuming this is a number based on the comment
  body: string;
  rich_text_body: Record<string, any>; // Using Record for a generic object type
  sent_at: string;
  created_at: string;
  sender: Record<string, any>;
  creation_uuid: string;
  chat_thread_id: number;
  parent_message_id: number;
  lesson_id: number;
  edited_at: string;
  replies_count: number;
  total_thread_participants_count: number;
  thread_participants_preview: Record<string, any>;
}
```

`deletedMessage`

1. This event gets broadcasted when a message gets deleted from the chat thread
2. Additional information received with the event:

```typescript
interface ParentMessage {
  id: number;
  chat_room_participant_id: string;
  rich_text_body: Record<string, any>;
  created_at: string;
  sender: Record<string, any>;
  creation_uuid: string;
  chat_thread_id: number;
  parent_message_id: number;
  lesson_id: number;
  edited_at: string;
  replies_count: number;
  total_thread_participants_count: number;
  thread_participants_preview: Record<string, any>;
}

interface MessageWithParent {
  id: number;
  parent_message: ParentMessage;
}
```

`chatThreadRead`

1. This event gets broadcasted when chatroom gets marked as read by a participant.
2. Additional information received with the event:

```typescript
{
  chat_thread_id: number
}
```
