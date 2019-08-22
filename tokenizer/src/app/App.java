package app;

import java.io.BufferedInputStream;
import java.io.FileInputStream;
import java.io.PrintStream;
import java.util.ArrayList;

import com.fasterxml.jackson.databind.ObjectMapper;

import macromedia.asc.parser.Scanner;
import macromedia.asc.parser.Tokens;
import macromedia.asc.util.Context;
import macromedia.asc.util.ContextStatics;

class App {
    public static void main(String[] args) throws Exception {

        BufferedInputStream buffer = new BufferedInputStream(new FileInputStream(args[0]));

        Scanner scanner = new Scanner(new Context(new ContextStatics()), buffer, "UTF-8", args[0]);
        // final String text = scanner.input.source();

        // for (int i = 0; i < 20; i++)
        //     System.out.println(text.codePointAt(i));

        // System.out.println(scanner.input.source());

        class Token {
            public int type;
            public int start;
            public int length;

            public Token(int type, int start, int length) {
                this.type = type;
                this.start = start;
                this.length = length;
            }
        }

        class ReturnObj {
            public ArrayList<Token> list = new ArrayList<Token>();
            public String text;
        }

        ReturnObj obj = new ReturnObj();
        obj.text = scanner.input.source();

        // ArrayList<Token> list = new ArrayList<Token>();

        int start = 0;
        int token;
        int length = 0;
        // String tokenText;

        do {
            token = scanner.nexttoken(false);

            // tokenText = scanner.getCurrentTokenTextOrTypeText(token);
            // if (Tokens.tokenClassNames[-1 * token] == tokenText)
            // tokenText = Tokens.tokenToString[-1 * token];

            // curPos = scanner.input.textPos();
            // startPos = curPos - tokenText.length();
            start = scanner.input.positionOfMark();
            length = scanner.input.markLength();

            // if (curPos < text.length())
            // tokenText = text.substring(startPos, curPos);
            // else
            // tokenText = "";
            // if (start >= text.length())
            //     start = text.length() - 1;
            // if (start + length >= text.length())
            //     length = text.length() - start - 1;

            // list.add(new Token(-1 * token, startPos, tokenText));
            obj.list.add(new Token(-1 * token, start, length));

            // if (curPos < text.length()) {
            // String substr = text.substring(startPos, curPos);

            // if (!tokenText.equals(substr)) {
            // System.out.println("[" + startPos + ":" + curPos + "] " +
            // Tokens.tokenClassNames[-1 * token] + " \"" + tokenText + "\"");
            // System.out.println(Tokens.tokenClassNames[-1 * token]);
            // System.out.println("[" + startPos + ":" + curPos + "] \"" + substr + "\"");
            // if (start < 100)
            // System.out.println("[" + start + ":" + (start + length) + "] \"" +
            // text.substring(start, start + length) + "\"");

            // startPos = scanner.input.positionOfMark();
            // curPos = startPos + scanner.input.markLength();
            // substr = text.substring(startPos, curPos);

            // System.out.println("[" + startPos + ":" + curPos + "] \"" + substr + "\"");
            // }
            // }
        } while (token != Tokens.EOS_TOKEN);

        ObjectMapper mapper = new ObjectMapper();
        PrintStream ps = new PrintStream(System.out, true, "UTF-8");
        ps.println(mapper.writeValueAsString(obj));
        // mapper.writeValueAsString(list);
        // ps.println("");
    }
}