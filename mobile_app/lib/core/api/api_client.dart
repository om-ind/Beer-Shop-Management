import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  late final Dio _dio;

  factory ApiClient() => _instance;

  ApiClient._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConstants.baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _loadCustomBaseUrl();

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString(AppConstants.tokenKey);
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (DioException error, handler) {
          handler.next(error);
        },
      ),
    );

    // Log in debug mode
    _dio.interceptors.add(
      LogInterceptor(
        requestBody: true,
        responseBody: true,
        logPrint: (msg) => debugPrint(msg.toString()),
      ),
    );
  }

  Future<void> _loadCustomBaseUrl() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final customUrl = prefs.getString('custom_api_base_url');
      if (customUrl != null && customUrl.isNotEmpty) {
        _dio.options.baseUrl = customUrl;
        debugPrint('Loaded custom base URL: $customUrl');
      } else {
        _dio.options.baseUrl = AppConstants.baseUrl;
        debugPrint('Using default base URL: ${AppConstants.baseUrl}');
      }
    } catch (e) {
      debugPrint('Error loading custom base URL: $e');
    }
  }

  Future<void> updateBaseUrl(String newUrl) async {
    _dio.options.baseUrl = newUrl;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('custom_api_base_url', newUrl);
    debugPrint('Updated and saved new base URL: $newUrl');
  }

  String get baseUrl => _dio.options.baseUrl;

  Dio get dio => _dio;

  // ─── Generic helpers ────────────────────────────────────────────────────────

  Future<Response> get(String path, {Map<String, dynamic>? params}) async {
    return await _dio.get(path, queryParameters: params);
  }

  Future<Response> post(String path, {dynamic data}) async {
    return await _dio.post(path, data: data);
  }

  Future<Response> put(String path, {dynamic data}) async {
    return await _dio.put(path, data: data);
  }

  Future<Response> delete(String path) async {
    return await _dio.delete(path);
  }

  Future<Response> patch(String path, {dynamic data}) async {
    return await _dio.patch(path, data: data);
  }
}

// Shortcut to use anywhere
void debugPrint(String msg) {
  // ignore: avoid_print
  print('[ApiClient] $msg');
}
