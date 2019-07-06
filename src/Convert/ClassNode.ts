import * as ts from "typescript";
import { doesExtend, addLeadingComments, addTrailingComments, doesImplement, hasName, hasIdentifier } from "../Utils";
import { convertMethod, convertMethodToFunction } from "./MethodNode";

export interface ClassInfo {
    requiresPlayer: ts.ClassElement[];
}

export function convertClassNode(sourceFile: ts.SourceFile, node: ts.ClassDeclaration, context: ts.TransformationContext) {

    const info: ClassInfo = {
        requiresPlayer: node.members.filter((member) => hasIdentifier(member, 'player'))
    };

    let extendsBaseContent = false;
    let implementsTimeAware = false;
    // let constructorNode;

    if (node.heritageClauses) {
        for (const heritageNode of node.heritageClauses) {
            if (doesExtend(heritageNode, 'BaseContent'))
                extendsBaseContent = true;
            // else if (doesExtend(heritageNode, 'Utils'))
            //     extendsBaseContent = true;

            if (doesImplement(heritageNode, 'TimeAwareInterface'))
                implementsTimeAware = true;
        }

        if (extendsBaseContent || implementsTimeAware) {

            // const methodNames = methodNodes.map((methodNode) => methodNode.name.getText());

            const memberNodes: ts.ClassElement[] = [];
            const externalNodes: ts.FunctionDeclaration[] = [];

            let member;
            for (let index = 0; index < node.members.length; index++) {
                member = node.members[index];
                if (ts.isPropertyDeclaration(member)) {
                    memberNodes.push(member);

                }
                else if (ts.isMethodDeclaration(member)) {
                    if (implementsTimeAware && (hasName(member.name, 'timeChange') || hasName(member.name, 'timeChangeLarge'))) {
                        memberNodes.push(convertMethod(member, context, info));
                    }
                    else {
                        // Convert Method to Function
                        const convertedNode = convertMethodToFunction(convertMethod(member, context, info));

                        if (index === 0)
                            addLeadingComments(sourceFile.text, node, convertedNode);

                        addLeadingComments(sourceFile.text, member, convertedNode);
                        addTrailingComments(sourceFile.text, member, convertedNode);

                        if (index === node.members.length - 1)
                            addTrailingComments(sourceFile.text, node, convertedNode);

                        externalNodes.push(convertedNode);
                    }
                }
                else if (ts.isConstructorDeclaration(member)) {
                    memberNodes.push(member);

                }
                else if (ts.isGetAccessorDeclaration(member)) {
                    memberNodes.push(member);

                }
                else if (ts.isSetAccessorDeclaration(member)) {
                    memberNodes.push(member);

                }
                else if (ts.isIndexSignatureDeclaration(member)) {
                    memberNodes.push(member);

                }
                else {
                    throw new Error('Unknown class member type ' + ts.SyntaxKind[member.kind]);
                }
            }

            if (implementsTimeAware) {
                // Remove BaseContent
                node.heritageClauses = ts.createNodeArray(node.heritageClauses.filter((heritageClause) => !doesExtend(heritageClause, 'BaseContent')));

                // Set new Memberss
                node.members = ts.createNodeArray(memberNodes);

                return [node, ...externalNodes];
            }

            return externalNodes;
        }
    }

    return node;

    // const list = [];

    // for (const childNode of node.getChildren()) {
    //     if (ts.isMethodDeclaration(childNode))
    //         list.push(convertMethodNode(childNode, context, methodNames));
    //     if (ts.isJSDocCommentContainingNode(node))
    // }

    // ts.getLeadingCommentRanges(node.getFullText(), node.pos);

    // node.forEachChild((child) => {
    //     console.log(ts.SyntaxKind[child.kind]);
    // });

    // console.log(node.getChildren().map((child) => ts.SyntaxKind[child.kind]));

    // return node.getChildren().map((childNode) => {
    //     if (ts.isMethodDeclaration(childNode))
    //         return convertMethodNode(childNode, context, methodNames)
    //     return childNode;
    // });

}
