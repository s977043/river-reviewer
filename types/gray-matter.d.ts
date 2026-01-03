declare module 'gray-matter' {
  export interface GrayMatterFile<T = any> {
    data: T;
    content: string;
    excerpt?: string;
    orig?: Buffer;
    language?: string;
    matter: string;
    stringify(data?: T): string;
  }

  export interface GrayMatterOptions<T = any> {
    excerpt?: boolean;
    excerpt_separator?: string;
    engines?: Record<string, (input: string) => unknown>;
    language?: string;
    delimiters?: string | [string, string];
    // Allow custom data type
    [key: string]: unknown;
  }

  function matter<T = any>(
    input: string | Buffer,
    options?: GrayMatterOptions<T>
  ): GrayMatterFile<T>;

  export default matter;
}
