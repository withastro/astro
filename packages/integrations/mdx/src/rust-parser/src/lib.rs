use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde_json;
use markdown::{to_mdast, ParseOptions, Constructs};
use markdown::mdast;

// Convert markdown AST to JSON-serializable format
fn mdast_to_json(node: &mdast::Node) -> serde_json::Value {
    match node {
        mdast::Node::Root(root) => {
            serde_json::json!({
                "type": "root",
                "children": root.children.iter().map(mdast_to_json).collect::<Vec<_>>(),
            })
        }
        mdast::Node::Heading(heading) => {
            serde_json::json!({
                "type": "heading",
                "depth": heading.depth,
                "children": heading.children.iter().map(mdast_to_json).collect::<Vec<_>>(),
            })
        }
        mdast::Node::Paragraph(para) => {
            serde_json::json!({
                "type": "paragraph",
                "children": para.children.iter().map(mdast_to_json).collect::<Vec<_>>(),
            })
        }
        mdast::Node::Text(text) => {
            serde_json::json!({
                "type": "text",
                "value": text.value,
            })
        }
        mdast::Node::Emphasis(emp) => {
            serde_json::json!({
                "type": "emphasis",
                "children": emp.children.iter().map(mdast_to_json).collect::<Vec<_>>(),
            })
        }
        mdast::Node::Strong(strong) => {
            serde_json::json!({
                "type": "strong",
                "children": strong.children.iter().map(mdast_to_json).collect::<Vec<_>>(),
            })
        }
        mdast::Node::Code(code) => {
            serde_json::json!({
                "type": "code",
                "lang": code.lang,
                "meta": code.meta,
                "value": code.value,
            })
        }
        mdast::Node::InlineCode(code) => {
            serde_json::json!({
                "type": "inlineCode",
                "value": code.value,
            })
        }
        mdast::Node::List(list) => {
            serde_json::json!({
                "type": "list",
                "ordered": list.ordered,
                "start": list.start,
                "spread": list.spread,
                "children": list.children.iter().map(mdast_to_json).collect::<Vec<_>>(),
            })
        }
        mdast::Node::ListItem(item) => {
            serde_json::json!({
                "type": "listItem",
                "spread": item.spread,
                "checked": item.checked,
                "children": item.children.iter().map(mdast_to_json).collect::<Vec<_>>(),
            })
        }
        mdast::Node::Blockquote(quote) => {
            serde_json::json!({
                "type": "blockquote",
                "children": quote.children.iter().map(mdast_to_json).collect::<Vec<_>>(),
            })
        }
        mdast::Node::Link(link) => {
            serde_json::json!({
                "type": "link",
                "url": link.url,
                "title": link.title,
                "children": link.children.iter().map(mdast_to_json).collect::<Vec<_>>(),
            })
        }
        mdast::Node::Image(img) => {
            serde_json::json!({
                "type": "image",
                "url": img.url,
                "title": img.title,
                "alt": img.alt,
            })
        }
        mdast::Node::Break(_) => {
            serde_json::json!({
                "type": "break",
            })
        }
        mdast::Node::ThematicBreak(_) => {
            serde_json::json!({
                "type": "thematicBreak",
            })
        }
        // MDX specific nodes
        mdast::Node::MdxJsxFlowElement(elem) => {
            serde_json::json!({
                "type": "mdxJsxFlowElement",
                "name": elem.name,
                "attributes": elem.attributes.iter().map(|attr| {
                    match attr {
                        mdast::AttributeContent::Property(prop) => {
                            serde_json::json!({
                                "type": "mdxJsxAttribute",
                                "name": prop.name,
                                "value": prop.value.as_ref().map(|v| match v {
                                    mdast::AttributeValue::Literal(s) => s.clone(),
                                    mdast::AttributeValue::Expression(expr) => format!("{{{}}}", expr.value),
                                }),
                            })
                        }
                        mdast::AttributeContent::Expression(expr) => {
                            serde_json::json!({
                                "type": "mdxJsxExpressionAttribute",
                                "value": expr.value,
                            })
                        }
                    }
                }).collect::<Vec<_>>(),
                "children": elem.children.iter().map(mdast_to_json).collect::<Vec<_>>(),
            })
        }
        mdast::Node::MdxJsxTextElement(elem) => {
            serde_json::json!({
                "type": "mdxJsxTextElement",
                "name": elem.name,
                "attributes": elem.attributes.iter().map(|attr| {
                    match attr {
                        mdast::AttributeContent::Property(prop) => {
                            serde_json::json!({
                                "type": "mdxJsxAttribute",
                                "name": prop.name,
                                "value": prop.value.as_ref().map(|v| match v {
                                    mdast::AttributeValue::Literal(s) => s.clone(),
                                    mdast::AttributeValue::Expression(expr) => format!("{{{}}}", expr.value),
                                }),
                            })
                        }
                        mdast::AttributeContent::Expression(expr) => {
                            serde_json::json!({
                                "type": "mdxJsxExpressionAttribute",
                                "value": expr.value,
                            })
                        }
                    }
                }).collect::<Vec<_>>(),
                "children": elem.children.iter().map(mdast_to_json).collect::<Vec<_>>(),
            })
        }
        mdast::Node::MdxjsEsm(esm) => {
            serde_json::json!({
                "type": "mdxjsEsm",
                "value": esm.value,
            })
        }
        mdast::Node::MdxFlowExpression(expr) => {
            serde_json::json!({
                "type": "mdxFlowExpression",
                "value": expr.value,
            })
        }
        mdast::Node::MdxTextExpression(expr) => {
            serde_json::json!({
                "type": "mdxTextExpression",
                "value": expr.value,
            })
        }
        // Frontmatter
        mdast::Node::Yaml(yaml) => {
            serde_json::json!({
                "type": "yaml",
                "value": yaml.value,
            })
        }
        mdast::Node::Toml(toml) => {
            serde_json::json!({
                "type": "toml",
                "value": toml.value,
            })
        }
        _ => {
            // For any other node types, create a generic representation
            serde_json::json!({
                "type": "unknown",
                "value": format!("{:?}", node),
            })
        }
    }
}

// Parse MDX to AST
#[napi]
pub fn parse_to_ast(content: String) -> Result<String> {
    let options = ParseOptions {
        constructs: Constructs {
            frontmatter: true,
            gfm_table: true,
            gfm_task_list_item: true,
            gfm_strikethrough: true,
            gfm_autolink_literal: true,
            gfm_footnote_definition: true,
            gfm_label_start_footnote: true,
            math_text: true,
            math_flow: true,
            mdx_esm: true,
            mdx_expression_flow: true,
            mdx_expression_text: true,
            mdx_jsx_flow: true,
            mdx_jsx_text: true,
            ..Constructs::mdx()
        },
        ..ParseOptions::mdx()
    };

    // Parse MDX to mdast
    match to_mdast(&content, &options) {
        Ok(ast) => {
            // Convert to JSON
            let json_ast = mdast_to_json(&ast);
            
            // Serialize to string
            match serde_json::to_string(&json_ast) {
                Ok(json) => Ok(json),
                Err(e) => Err(Error::new(
                    Status::GenericFailure,
                    format!("Failed to serialize AST: {}", e),
                )),
            }
        }
        Err(e) => Err(Error::new(
            Status::GenericFailure,
            format!("Failed to parse MDX: {}", e),
        )),
    }
}

// Generate JavaScript from AST
#[napi]
pub fn generate_from_ast(ast_json: String) -> Result<String> {
    // Parse JSON AST
    let ast: serde_json::Value = match serde_json::from_str(&ast_json) {
        Ok(ast) => ast,
        Err(e) => {
            return Err(Error::new(
                Status::GenericFailure,
                format!("Failed to deserialize AST: {}", e),
            ))
        }
    };
    
    // Generate JavaScript/JSX
    let mut output = String::new();
    
    // Add imports
    output.push_str("/*@jsxRuntime automatic*/\n");
    output.push_str("/*@jsxImportSource astro*/\n");
    output.push_str("import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from 'astro/jsx-runtime';\n\n");
    
    // Generate component function
    output.push_str("function _createMdxContent(props) {\n");
    output.push_str("  const _components = {\n");
    output.push_str("    ...props.components,\n");
    output.push_str("  };\n");
    output.push_str("  return ");
    
    // Generate JSX from AST
    let jsx = generate_jsx_from_json(&ast)?;
    output.push_str(&jsx);
    
    output.push_str(";\n}\n\n");
    output.push_str("export default _createMdxContent;\n");
    
    Ok(output)
}

// Helper to generate JSX from JSON AST
fn generate_jsx_from_json(node: &serde_json::Value) -> Result<String> {
    let node_type = node.get("type")
        .and_then(|t| t.as_str())
        .unwrap_or("unknown");
    
    match node_type {
        "root" => {
            if let Some(children) = node.get("children").and_then(|c| c.as_array()) {
                let child_jsx: Vec<String> = children
                    .iter()
                    .filter_map(|child| generate_jsx_from_json(child).ok())
                    .collect();
                
                if child_jsx.len() == 1 {
                    Ok(child_jsx[0].clone())
                } else {
                    Ok(format!(
                        "_jsxs(_Fragment, {{ children: [{}] }})",
                        child_jsx.join(", ")
                    ))
                }
            } else {
                Ok("null".to_string())
            }
        }
        "heading" => {
            let depth = node.get("depth")
                .and_then(|d| d.as_u64())
                .unwrap_or(1);
            let tag = format!("h{}", depth);
            
            if let Some(children) = node.get("children").and_then(|c| c.as_array()) {
                let child_jsx: Vec<String> = children
                    .iter()
                    .filter_map(|child| generate_jsx_from_json(child).ok())
                    .collect();
                
                Ok(format!(
                    "_jsx(_components.{} || '{}', {{ children: {} }})",
                    tag, tag,
                    if child_jsx.len() == 1 {
                        child_jsx[0].clone()
                    } else {
                        format!("[{}]", child_jsx.join(", "))
                    }
                ))
            } else {
                Ok(format!("_jsx(_components.{} || '{}')", tag, tag))
            }
        }
        "paragraph" => {
            if let Some(children) = node.get("children").and_then(|c| c.as_array()) {
                let child_jsx: Vec<String> = children
                    .iter()
                    .filter_map(|child| generate_jsx_from_json(child).ok())
                    .collect();
                
                Ok(format!(
                    "_jsx(_components.p || 'p', {{ children: {} }})",
                    if child_jsx.len() == 1 {
                        child_jsx[0].clone()
                    } else {
                        format!("[{}]", child_jsx.join(", "))
                    }
                ))
            } else {
                Ok("_jsx(_components.p || 'p')".to_string())
            }
        }
        "text" => {
            if let Some(value) = node.get("value").and_then(|v| v.as_str()) {
                Ok(format!("'{}'", value.replace('\'', "\\'")))
            } else {
                Ok("''".to_string())
            }
        }
        "strong" | "emphasis" => {
            let tag = if node_type == "strong" { "strong" } else { "em" };
            
            if let Some(children) = node.get("children").and_then(|c| c.as_array()) {
                let child_jsx: Vec<String> = children
                    .iter()
                    .filter_map(|child| generate_jsx_from_json(child).ok())
                    .collect();
                
                Ok(format!(
                    "_jsx(_components.{} || '{}', {{ children: {} }})",
                    tag, tag,
                    if child_jsx.len() == 1 {
                        child_jsx[0].clone()
                    } else {
                        format!("[{}]", child_jsx.join(", "))
                    }
                ))
            } else {
                Ok(format!("_jsx(_components.{} || '{}')", tag, tag))
            }
        }
        "code" => {
            let lang = node.get("lang")
                .and_then(|l| l.as_str())
                .unwrap_or("");
            let value = node.get("value")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            
            Ok(format!(
                "_jsx(_components.pre || 'pre', {{ children: _jsx(_components.code || 'code', {{ className: '{}', children: '{}' }}) }})",
                if !lang.is_empty() { format!("language-{}", lang) } else { String::new() },
                value.replace('\'', "\\'")
            ))
        }
        "inlineCode" => {
            let value = node.get("value")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            
            Ok(format!(
                "_jsx(_components.code || 'code', {{ children: '{}' }})",
                value.replace('\'', "\\'")
            ))
        }
        "list" => {
            let ordered = node.get("ordered")
                .and_then(|o| o.as_bool())
                .unwrap_or(false);
            let tag = if ordered { "ol" } else { "ul" };
            
            if let Some(children) = node.get("children").and_then(|c| c.as_array()) {
                let child_jsx: Vec<String> = children
                    .iter()
                    .filter_map(|child| generate_jsx_from_json(child).ok())
                    .collect();
                
                Ok(format!(
                    "_jsx(_components.{} || '{}', {{ children: [{}] }})",
                    tag, tag,
                    child_jsx.join(", ")
                ))
            } else {
                Ok(format!("_jsx(_components.{} || '{}')", tag, tag))
            }
        }
        "listItem" => {
            if let Some(children) = node.get("children").and_then(|c| c.as_array()) {
                let child_jsx: Vec<String> = children
                    .iter()
                    .filter_map(|child| generate_jsx_from_json(child).ok())
                    .collect();
                
                Ok(format!(
                    "_jsx(_components.li || 'li', {{ children: {} }})",
                    if child_jsx.len() == 1 {
                        child_jsx[0].clone()
                    } else {
                        format!("[{}]", child_jsx.join(", "))
                    }
                ))
            } else {
                Ok("_jsx(_components.li || 'li')".to_string())
            }
        }
        "mdxJsxFlowElement" | "mdxJsxTextElement" => {
            let name = node.get("name")
                .and_then(|n| n.as_str())
                .unwrap_or("div");
            
            if let Some(children) = node.get("children").and_then(|c| c.as_array()) {
                let child_jsx: Vec<String> = children
                    .iter()
                    .filter_map(|child| generate_jsx_from_json(child).ok())
                    .collect();
                
                if child_jsx.is_empty() {
                    Ok(format!("_jsx({}, {{}})", name))
                } else if child_jsx.len() == 1 {
                    Ok(format!("_jsx({}, {{ children: {} }})", name, child_jsx[0]))
                } else {
                    Ok(format!(
                        "_jsxs({}, {{ children: [{}] }})",
                        name,
                        child_jsx.join(", ")
                    ))
                }
            } else {
                Ok(format!("_jsx({}, {{}})", name))
            }
        }
        _ => {
            // For unknown types, return null
            Ok("null".to_string())
        }
    }
}

// Combined compile function for testing
#[napi]
pub fn compile_mdx(content: String) -> Result<String> {
    // Parse to AST
    let ast_json = parse_to_ast(content)?;
    
    // Generate from AST
    generate_from_ast(ast_json)
}