# Headless

<figure><img src="https://3386231300-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FTxViy1AlkVpH99B9E7eY%2Fuploads%2FuHLf0tr3SSNpAEoxpvUf%2FHeadless.jpg?alt=media&#x26;token=8ad45254-90b6-4ea3-aa4f-269988c95340" alt=""><figcaption></figcaption></figure>

Available on our Business plan and above:

* [**Member API**](https://api-headless.circle.so/?urls.primaryName=Member%20APIs): A server-side API with endpoints for building your own member-side experiences in your app or website. [See endpoints](https://api-headless.circle.so/?urls.primaryName=Member%20APIs)\
  \
  Unlike the admin API, requests are member-authenticated via the member-specific JWT tokens you'll generate with the [Auth API](https://api-headless.circle.so/).\
  \
  This means every API request is made on behalf of a signed in member on your website or app, allowing you to write your own client-side code for integrating posts, comments, events, notifications, and more into your website or app.<br>
* [**Auth API**](https://api.circle.so/apis/headless/quick-start)**:** A server-side API to authenticate your website or app’s signed in members with the Member API using a JWT token. [See endpoints](https://api-headless.circle.so/)

{% hint style="info" %}
Please note:\
\- The `access_token` persists across sessions, allowing users to possess multiple tokens concurrently.\
\- We do not revoke the`access_token` automatically\
\- Our system automatically revokes the `refresh_token` after one month for enhanced security\
\- If you need selective token revocation, our API offers endpoints dedicated to both `access_token` and `refresh_token` revocation
{% endhint %}

### Security

1. Keep your application token secure by making server-side calls for the Auth API. **Do not expose your admin API token or your application token in your client-side code.**
2. Implement token management for the Member API using JWT access and refresh tokens on the client-side.

For the full list of API endpoints, please visit [https://api-headless.circle.so/.](https://api-headless.circle.so/)

### Feedback

* If you have general questions or want to share your creations with the developer community, please check out our [Developer community space](https://community.circle.so/c/developers/).&#x20;
* If you have API feedback for our engineering team, [please use this form](https://circleco.typeform.com/to/xFEpyITZ#email=xxxxx\&visitor=xxxxx) to reach out to us.
