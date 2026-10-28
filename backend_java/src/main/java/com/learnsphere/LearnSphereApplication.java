package com.learnsphere;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableCaching
@EnableAsync
public class LearnSphereApplication {

    public static void main(String[] args) {
        // Load .env file
        try {
            Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
            dotenv.entries().forEach(entry -> {
                if (System.getProperty(entry.getKey()) == null) {
                    System.setProperty(entry.getKey(), entry.getValue());
                }
            });

            // Also check ./backend_java directory if started from workspace root
            if (System.getProperty("GROQ_API_KEY1") == null && System.getProperty("GROQ_API_KEY") == null) {
                try {
                    Dotenv subDotenv = Dotenv.configure().directory("./backend_java").ignoreIfMissing().load();
                    subDotenv.entries().forEach(entry -> {
                        if (System.getProperty(entry.getKey()) == null) {
                            System.setProperty(entry.getKey(), entry.getValue());
                        }
                    });
                } catch (Exception ignored) {}
            }
        } catch (Exception e) {
            System.out.println("No .env file found or error loading it, using default properties.");
        }

        SpringApplication.run(LearnSphereApplication.class, args);
    }
}
