declare module 'tree-sitter' {
    class Parser {
        setLanguage(language: any): void;
        parse(input: string): Parser.Tree;
    }

    namespace Parser {
        export interface Tree {
            rootNode: SyntaxNode;
        }

        export interface SyntaxNode {
            type: string;
            text: string;
            startPosition: { row: number; column: number };
            endPosition: { row: number; column: number };
            childCount: number;
            child(index: number): SyntaxNode | null;
            childForFieldName(fieldName: string): SyntaxNode | null;
        }
    }

    export = Parser;
}
