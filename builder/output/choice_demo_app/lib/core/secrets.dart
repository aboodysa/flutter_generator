// [generated] generator=SecretsGenerator template=secrets.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.

// Secrets are NEVER stored as literals. They come from env / secure storage.
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class Secrets {
  const Secrets(this._storage);
  final FlutterSecureStorage _storage;

  Future<String?> read(String key) => _storage.read(key: key);
  Future<void> write(String key, String value) => _storage.write(key: key, value: value);
}
