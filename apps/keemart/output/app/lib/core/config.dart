// [generated] generator=ConfigGenerator template=config.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.

abstract final class AppConfig {
  static const apiBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:8080');
  static const environment = String.fromEnvironment('ENV', defaultValue: 'dev');
}
