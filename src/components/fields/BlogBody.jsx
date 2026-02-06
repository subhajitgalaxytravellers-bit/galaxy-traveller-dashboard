import React from "react";
import PropTypes from "prop-types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { slugify, getNodeText } from "../../utils/slugify";
import styles from "./styles.module.css";

const BlogBody = ({ body }) => {
  return (
    <div className={styles.blogLayoutContainer + " custom-y-scroll"}>
      <div className={styles.contentColumn + " custom-y-scroll"}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // --- H2 Renderer ---
            h2: ({ children, ...props }) => {
              const text = getNodeText(children);
              const id = slugify(text);
              return (
                <h2 id={id} className="text-[38px]">
                  {children}
                </h2>
              );
            },

            // --- Link Renderer ---
            a: ({ href, children, ...props }) => {
              const external =
                href &&
                (href.startsWith("http://") || href.startsWith("https://"));

              return (
                <a
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  {...props}
                >
                  {children}
                </a>
              );
            },

            // --- Image Renderer ---
            img: ({ src, alt, ...props }) => {
              let effectiveAlt = alt || "";

              if (!effectiveAlt && src) {
                try {
                  const filename =
                    src.split("/").pop()?.split(".")[0] || "blog image";
                  effectiveAlt = filename.replace(/[-_]/g, " ");
                } catch {
                  effectiveAlt = "blog image";
                }
              }

              return (
                <img
                  src={src}
                  alt={effectiveAlt}
                  className={styles.blogImage + " w-full"}
                  loading="lazy"
                  {...props}
                />
              );
            },

            // --- Paragraph ---
            p: ({ children, ...props }) => (
              <p className={"text-[16px]"} {...props}>
                {children}
              </p>
            ),

            // --- UL ---
            ul: ({ children, ...props }) => (
              <ul className={styles.list} {...props}>
                {children}
              </ul>
            ),

            // --- OL ---
            ol: ({ children, ...props }) => (
              <ol className={styles.list} {...props}>
                {children}
              </ol>
            ),

            // --- LI ---
            li: ({ children, ...props }) => (
              <li className={styles.listItem} {...props}>
                {children}
              </li>
            ),

            // --- Strong ---
            strong: ({ children, ...props }) => (
              <strong className={styles.strong} {...props}>
                {children}
              </strong>
            ),

            // --- Blockquote ---
            blockquote: ({ children, ...props }) => (
              <blockquote className={styles.blockquote} {...props}>
                {children}
              </blockquote>
            ),
          }}
        >
          {body}
        </ReactMarkdown>
      </div>
    </div>
  );
};

BlogBody.propTypes = {
  body: PropTypes.string.isRequired,
};

export default BlogBody;
