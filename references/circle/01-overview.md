# Overview

<figure><img src="https://3386231300-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FTxViy1AlkVpH99B9E7eY%2Fuploads%2FU8KN4dOm0RxqeATSynCq%2FCircle%20Developers.jpg?alt=media&#x26;token=6ad62a53-59d7-4677-af0d-c9fc3678a73a" alt=""><figcaption></figcaption></figure>

Circle provides a powerful suite of APIs to developers to build automations, run migrations, bring data into your own data warehouse, or natively integrate community features into your own website or app.

## The Circle Developer Platform

#### **1.** [**Admin API**](https://api.circle.so/apis/admin-api)

Available to customers on our Business plan and above, our [**Admin API**](https://api.circle.so/apis/admin-api) is designed for community admins to build automations, migration scripts, and administrative integrations.

Requests are admin-authenticated, which means the API can only be used to build administrative tooling and automations.

#### **2.** [**Headless**](https://api.circle.so/apis/headless)

Available to customers on our Business plan and above, our **Headless** offering is designed for communities to integrate Circle features into their own website or app, like discussions, feed, notifications, events, and more.

Headless consists of three components:

* [**Member API**](https://api.circle.so/apis/headless/member-api): A server-side API with endpoints for building your own member-side experiences in your app or website. [See endpoints](https://api-headless.circle.so/?urls.primaryName=Member%20APIs)\
  \
  Unlike the admin API, requests are member-authenticated via the member-specific JWT tokens you'll generate with the [Auth API](https://api-headless.circle.so/).\
  \
  This means every API request is made on behalf of a signed in member on your website or app, allowing you to write your own client-side code for integrating posts, comments, events, notifications, and more into your website or app.\ <br>
* [**Auth API**](https://api.circle.so/apis/headless/quick-start)**:** A server-side API to authenticate your website or app’s signed in members with the Member API using a JWT token. [See endpoints](https://api-headless.circle.so/)\
  \
  Optionally, you can use the [Auth SDK ](https://api.circle.so/apis/headless/auth-sdk)for Node.js to get a head-start with your Node application.

#### **3.** [**Data API**](https://api.circle.so/apis/data-api)

Available to customers on our Plus Platform plan only, the [**Data API**](https://api.circle.so/apis/data-api) is a special API which lets your data team integrate your community's event stream data into your own warehouse via an ETL integration with a tool like [Airbyte](https://airbyte.com/?utm_term=airbyte\&utm_campaign=TDD_Search_Brand_USA\&utm_source=adwords\&utm_medium=ppc\&hsa_acc=4651612872\&hsa_cam=20643300404\&hsa_grp=155311392438\&hsa_ad=676665180945\&hsa_src=g\&hsa_tgt=kwd-1354459259989\&hsa_kw=airbyte\&hsa_mt=p\&hsa_net=adwords\&hsa_ver=3\&gad_source=1\&gclid=Cj0KCQjw0Oq2BhCCARIsAA5hubW5f6DBG_s2vIImSEgivxfKG6cwVCBAIMsJbJ5igqURirIbhe5elq8aAtFcEALw_wcB) or similar.

### Feedback

* If you have general questions or want to share your creations with the developer community, please check out our [Developer community space](https://community.circle.so/c/developers/).&#x20;
* If you have API feedback for our engineering team, [please use this form](https://circleco.typeform.com/to/xFEpyITZ#email=xxxxx\&visitor=xxxxx) to reach out to us.<br>

## More information

If you're new to Circle, we recommend checking out the [Knowledge Base](https://help.circle.so/p/basics).
