package app;

import java.io.BufferedInputStream;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import macromedia.asc.parser.Scanner;
import macromedia.asc.parser.Tokens;
import macromedia.asc.util.Context;
import macromedia.asc.util.ContextStatics;

class App {
    public static void writeToFile(String fileName, String text) throws IOException {
        BufferedWriter writer = new BufferedWriter(new FileWriter(fileName));
        writer.write(text);

        writer.close();
    }

    public static void getAS3Files(File dir, List<File> list) {
        if (!dir.isDirectory()) {
            list.add(dir);
        }
        else {
            File[] files = dir.listFiles();
            for (File file : files) {
                if (file.isDirectory()) {
                    getAS3Files(file, list);
                } else if (file.toString().endsWith(".as")) {
                    list.add(file);
                }
            }
        }
    }

    public static void tokenize(File file) throws JsonProcessingException, IOException {
        BufferedInputStream buffer = new BufferedInputStream(new FileInputStream(file));

        Scanner scanner = new Scanner(new Context(new ContextStatics()), buffer, "UTF-8", file.toString());
        // final String text = scanner.input.source();

        // for (int i = 0; i < 20; i++)
        // System.out.println(text.codePointAt(i));

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

        ArrayList<Token> list = new ArrayList<Token>();

        int start = 0;
        int token;
        int length = 0;

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
            // start = text.length() - 1;
            // if (start + length >= text.length())
            // length = text.length() - start - 1;

            // list.add(new Token(-1 * token, startPos, tokenText));
            list.add(new Token(-1 * token, start, length));

            // if (curPos < text.length()) {
            // String substr = text.substring(startPos, curPos);
            // String substr = scanner.input.source().substring(start, start + length);

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
            // System.out.println("[" + start + ":" + (start + length) + "] " +
            // Tokens.tokenClassNames[-1 * token] + " \"" + substr + "\"");
            // }
            // }
        } while (token != Tokens.EOS_TOKEN);

        ObjectMapper mapper = new ObjectMapper();
        // PrintStream ps = new PrintStream(System.out, true, "UTF-8");
        // ps.println(mapper.writeValueAsString(obj));
        // mapper.writeValueAsString(obj);
        // ps.println("");

        writeToFile(file.toString().replace(".as", ".tkns"), mapper.writeValueAsString(list));

    }

    public static void main(String[] args) throws Exception {
        List<File> fileList = new ArrayList<File>();
        
        getAS3Files(new File(args[0]), fileList);

        for (File file : fileList) {
            System.out.println("Tokenizing " + file.toString());
            tokenize(file);
        }
    }
}