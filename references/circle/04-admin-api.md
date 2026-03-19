# Admin API

<figure><img src="https://3386231300-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FTxViy1AlkVpH99B9E7eY%2Fuploads%2FMEzmwUSlfnjOeW3Tm2mY%2FAdmin%20API.jpg?alt=media&#x26;token=dc1cf2fa-574d-497d-b24f-e2bf6d4b9a94" alt=""><figcaption></figcaption></figure>

> Note: the admin API is not meant to be used on the client side, or to re-create your own Circle experience from scratch. If you're looking to build client-side features for your members to interact with your community in your own website or app, please refer to our [Headless API](https://api.circle.so/apis/headless).

### Fetch your API token

Community admins can obtain an API token by going to the **Developers -> Tokens** page in their community. Please keep your key private — do not share your key with anyone or make it publicly accessible in any form.

### API versions

In September 2024, we'll be introducing the Admin API v2 which addresses several limitations with the v1 API, including:

1. Lack of versioning
2. OpenAPI spec compatibility
3. Performance issues with large datasets
4. Missing endpoints

### See endpoints

* [V1](https://api-v1.circle.so/)
* [V2](https://api-headless.circle.so/?urls.primaryName=Admin%20APIs#/) (default)

#### Which API version should I use?

We **strongly recommend** using the admin API v2 whenever possible, and updating your codebase to v2 endpoints if you've built automations with the v1 API.

While we don't plan to deprecate the v1 API any time soon, new endpoints and updates will only be added to our v2 API going forward.&#x20;

### Paginated requests

1. **Pagination params**:
   * `page`: This parameter allows you to specify which page of results you want to retrieve. If not provided, it defaults to page 1.
   * `per_page`: This parameter lets you set how many items you want per page. If not specified, it will default to 10 items per page.
2. **Response structure**:
   * `page`: The current page number
   * `per_page`: The number of items per page
   * `has_next_page`: A boolean indicating if there are more pages after the current one
   * `count`: The total number of items across all pages
   * `page_count`: The total number of pages
   * `records`: An array containing the data for the current page
3. **Example usage**: To get the second page with 30 items per page, you would make a request like this:

```bash
curl -X GET "https://app.circle.so/api/headless/admin/v1/posts?page=2&per_page=30" \
     -H "Authorization: Bearer <API_Token>" \
     -H "Content-Type: application/json"
```

Remember, when implementing pagination in your application, it's good practice to respect the `has_next_page` flag and try not request pages beyond what's available. Also, be aware that the total count might change between requests if new posts are added or removed.

### Feedback

* If you have general questions or want to share your creations with the developer community, please check out our [Developer community space](https://community.circle.so/c/developers/).&#x20;
* If you have API feedback for our engineering team, [please use this form](https://circleco.typeform.com/to/xFEpyITZ#email=xxxxx\&visitor=xxxxx) to reach out to us.
