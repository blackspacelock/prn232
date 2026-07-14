import 'package:flutter/widgets.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../storage/token_storage.dart';
import 'api_constants.dart';

ValueNotifier<GraphQLClient> buildGraphQLClient() {
  final authLink = AuthLink(
    getToken: () async {
      final token = await TokenStorage.getAccessToken();
      return token != null ? 'Bearer $token' : null;
    },
  );

  final httpLink = HttpLink(ApiConstants.graphqlEndpoint);
  final link = authLink.concat(httpLink);

  return ValueNotifier(
    GraphQLClient(
      link: link,
      cache: GraphQLCache(store: InMemoryStore()),
    ),
  );
}
