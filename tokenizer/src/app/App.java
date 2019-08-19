package app;

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

        StringBuilder text = new StringBuilder();
        String NL = System.getProperty("line.separator");
        java.util.Scanner fileScanner = new java.util.Scanner(new FileInputStream(args[0]), "UTF-8");
        try {
            while (fileScanner.hasNextLine()) {
                text.append(fileScanner.nextLine() + NL);
            }
        } finally {
            fileScanner.close();
        }
        Scanner scanner = new Scanner(new Context(new ContextStatics()), text.toString(), args[0]);

        // System.out.println(scanner.input.source());

        class Token {
            public int type;
            public int start;
            public String text;

            public Token(int type, int start, String text) {
                this.type = type;
                this.start = start;
                this.text = text;
            }
        }

        ArrayList<Token> list = new ArrayList<Token>();

        int startPos = 0;
        int token;
        int curPos = 0;
        String tokenText;

        do {
            token = scanner.nexttoken(false);

            tokenText = scanner.getCurrentTokenTextOrTypeText(token);
            if (Tokens.tokenClassNames[-1 * token] == tokenText)
                tokenText = Tokens.tokenToString[-1 * token];

            curPos = scanner.input.textPos();
            startPos = curPos - tokenText.length();

            list.add(new Token(-1 * token, startPos, tokenText));

            // System.out.println("[" + startPos + ":" + curPos + "] " + Tokens.tokenClassNames[-1 * token] + " \"" + tokenText + "\"");
        } while (token != Tokens.EOS_TOKEN);

        ObjectMapper mapper = new ObjectMapper();
        PrintStream ps = new PrintStream(System.out, true, "UTF-8");
        ps.println(mapper.writeValueAsString(list));
    }
}