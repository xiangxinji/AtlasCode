import { QueryConfig, WasmFileConfig } from "@/types/repo-map";

/**
 * Tree-sitter 查询配置
 * JS 和 TS 使用相同的查询语法
 */
export const QUERIES: QueryConfig = {
  js: `
    (import_statement source: (string) @dep)
    (export_statement source: (string) @dep)
    (call_expression
      function: (import)
      arguments: (arguments (string) @dep))
  `,
  ts: `
    (import_statement source: (string) @dep)
    (export_statement source: (string) @dep)
    (call_expression
      function: (import)
      arguments: (arguments (string) @dep))
  `,
  java: `
    (import_declaration (scoped_identifier) @dep)
    (import_declaration (identifier) @dep)
  `,
  html: `
    ; 匹配所有 src 属性值（用于 script、img 等）
    (attribute
      (attribute_name) @attr.name
      (quoted_attribute_value
        (attribute_value) @dep))
      (#eq? @attr.name "src")

    ; 匹配所有 href 属性值（用于 link、a 等）
    (attribute
      (attribute_name) @attr.name
      (quoted_attribute_value
        (attribute_value) @dep))
      (#eq? @attr.name "href")
  `,
  css: `
    ; 匹配 @import 语句中的字符串
    (import_statement
      (string_value) @dep)
  `,
  scss: `
    ; SCSS 使用与 CSS 相同的查询
    (import_statement
      (string_value) @dep)
  `,
  less: `
    ; LESS 使用与 CSS 相同的查询
    (import_statement
      (string_value) @dep)
  `
};

// 保持向后兼容
export const JS_TS_QUERY = QUERIES.js;

/**
 * WASM 文件路径配置
 */
export const WASM_FILES: WasmFileConfig = {
  js: 'tree-sitter-javascript.wasm',
  ts: 'tree-sitter-typescript-typescript.wasm',
  java: 'tree-sitter-java.wasm',
  html: 'tree-sitter-html.wasm',
  css: 'tree-sitter-css.wasm',
  scss: 'tree-sitter-css.wasm',  // SCSS 使用 CSS 解析器
  less: 'tree-sitter-css.wasm'   // LESS 使用 CSS 解析器
};
