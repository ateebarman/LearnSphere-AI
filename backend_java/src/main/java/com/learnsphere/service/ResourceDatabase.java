package com.learnsphere.service;

import com.learnsphere.model.Roadmap;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ResourceDatabase {

    private static final Map<String, List<Roadmap.RoadmapResource>> resourceDatabase = new HashMap<>();

    static {
        // Deep Learning
        resourceDatabase.put("deep learning", Arrays.asList(
                createResource("Deep Learning Book by Goodfellow", "doc", "https://www.deeplearningbook.org/"),
                createResource("Stanford CS231n: CNN for Visual Recognition", "doc", "http://cs231n.stanford.edu/"),
                createResource("Fast.ai Deep Learning Course", "article", "https://course.fast.ai/"),
                createResource("TensorFlow Deep Learning Guide", "doc", "https://www.tensorflow.org/guide"),
                createResource("Deep Learning Specialization - Coursera", "article", "https://www.coursera.org/specializations/deep-learning")
        ));

        // Machine Learning
        resourceDatabase.put("machine learning", Arrays.asList(
                createResource("Scikit-learn Documentation", "doc", "https://scikit-learn.org/stable/"),
                createResource("Andrew Ng Machine Learning Course", "article", "https://www.coursera.org/learn/machine-learning"),
                createResource("ML Mastery Blog", "article", "https://machinelearningmastery.com/"),
                createResource("Google Machine Learning Crash Course", "doc", "https://developers.google.com/machine-learning/crash-course"),
                createResource("Kaggle Learn - Machine Learning", "challenge", "https://www.kaggle.com/learn")
        ));

        // Python
        resourceDatabase.put("python", Arrays.asList(
                createResource("Official Python Documentation", "doc", "https://docs.python.org/3/"),
                createResource("Real Python Tutorials", "article", "https://realpython.com/"),
                createResource("Python.org Getting Started", "doc", "https://www.python.org/about/gettingstarted/"),
                createResource("Automate the Boring Stuff with Python", "article", "https://automatetheboringstuff.com/"),
                createResource("LeetCode Python Problems", "challenge", "https://leetcode.com/problemset/all/?topicSlugs=string")
        ));

        // JavaScript
        resourceDatabase.put("javascript", Arrays.asList(
                createResource("MDN JavaScript Guide", "doc", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"),
                createResource("JavaScript.info Complete Course", "article", "https://javascript.info/"),
                createResource("Eloquent JavaScript Book", "article", "https://eloquentjavascript.net/"),
                createResource("Node.js Official Documentation", "doc", "https://nodejs.org/en/docs/"),
                createResource("Codewars JavaScript Challenges", "challenge", "https://www.codewars.com/")
        ));

        // React
        resourceDatabase.put("react", Arrays.asList(
                createResource("Official React Documentation", "doc", "https://react.dev/"),
                createResource("React - Getting Started", "article", "https://react.dev/learn"),
                createResource("React Hooks Tutorial", "article", "https://react.dev/reference/react/hooks"),
                createResource("Next.js Official Guide", "doc", "https://nextjs.org/docs"),
                createResource("Frontend Masters React Course", "article", "https://frontendmasters.com/courses/react-v8/")
        ));

        // Web Development
        resourceDatabase.put("web development", Arrays.asList(
                createResource("MDN Web Docs", "doc", "https://developer.mozilla.org/en-US/docs/Web"),
                createResource("HTML & CSS Guide", "article", "https://www.w3schools.com/"),
                createResource("Web.dev by Google", "doc", "https://web.dev/"),
                createResource("CSS-Tricks Blog", "article", "https://css-tricks.com/"),
                createResource("Frontend Mentor Challenges", "challenge", "https://www.frontendmentor.io/")
        ));

        // Database
        resourceDatabase.put("database", Arrays.asList(
                createResource("MongoDB Official Documentation", "doc", "https://docs.mongodb.com/"),
                createResource("PostgreSQL Documentation", "doc", "https://www.postgresql.org/docs/"),
                createResource("SQL Tutorial - W3Schools", "article", "https://www.w3schools.com/sql/"),
                createResource("Database Design Fundamentals", "article", "https://sqlzoo.net/"),
                createResource("LeetCode SQL Problems", "challenge", "https://leetcode.com/problemset/database/")
        ));

        // Data Structures
        resourceDatabase.put("data structures", Arrays.asList(
                createResource("GeeksforGeeks Data Structures", "doc", "https://www.geeksforgeeks.org/data-structures/"),
                createResource("Visualization Algorithm", "article", "https://www.visualgo.net/"),
                createResource("LeetCode Data Structure Problems", "challenge", "https://leetcode.com/problemset/all/?topicSlugs=array%2Cstack%2Cqueue"),
                createResource("CS50 Data Structures", "article", "https://cs50.harvard.edu/"),
                createResource("Udacity Data Structures Nanodegree", "article", "https://www.udacity.com/course/data-structures-and-algorithms-nanodegree--nd256")
        ));

        // Algorithms
        resourceDatabase.put("algorithms", Arrays.asList(
                createResource("Introduction to Algorithms (CLRS)", "doc", "https://en.wikipedia.org/wiki/Introduction_to_Algorithms"),
                createResource("LeetCode Algorithm Problems", "challenge", "https://leetcode.com/problemset/all/"),
                createResource("HackerRank Algorithms", "challenge", "https://www.hackerrank.com/domains/algorithms"),
                createResource("Big-O Cheat Sheet", "article", "https://www.bigocheatsheet.com/"),
                createResource("Sorting Visualizer", "article", "https://www.toptal.com/developers/sorting-visualizer")
        ));

        // LLM
        resourceDatabase.put("llm", Arrays.asList(
                createResource("Hugging Face Course", "doc", "https://huggingface.co/learn/nlp-course/"),
                createResource("OpenAI API Documentation", "doc", "https://platform.openai.com/docs/introduction"),
                createResource("LangChain Documentation", "doc", "https://python.langchain.com/"),
                createResource("Transformers Documentation", "doc", "https://huggingface.co/docs/transformers/index"),
                createResource("DeepLearning.AI Short Courses", "article", "https://www.deeplearning.ai/short-courses/")
        ));

        // System Design
        resourceDatabase.put("system design", Arrays.asList(
                createResource("System Design Interview - Alex Xu", "article", "https://bytebytego.com/"),
                createResource("The System Design Primer", "doc", "https://github.com/donnemartin/system-design-primer"),
                createResource("High Scalability Blog", "article", "http://highscalability.com/"),
                createResource("AWS Architecture Center", "doc", "https://aws.amazon.com/architecture/"),
                createResource("Grokking the System Design Interview", "article", "https://www.designgurus.io/course/grokking-the-system-design-interview")
        ));
    }

    private static Roadmap.RoadmapResource createResource(String title, String type, String url) {
        Roadmap.RoadmapResource r = new Roadmap.RoadmapResource();
        r.setTitle(title);
        r.setType(type);
        r.setUrl(url);
        r.setSource("external");
        return r;
    }

    public List<Roadmap.RoadmapResource> getResourcesForTopic(String topic) {
        if (topic == null) return getDefaultResources();

        String normalizedTopic = topic.toLowerCase().trim();

        if (resourceDatabase.containsKey(normalizedTopic)) {
            return new ArrayList<>(resourceDatabase.get(normalizedTopic));
        }

        for (Map.Entry<String, List<Roadmap.RoadmapResource>> entry : resourceDatabase.entrySet()) {
            if (normalizedTopic.contains(entry.getKey()) || entry.getKey().contains(normalizedTopic)) {
                return new ArrayList<>(entry.getValue());
            }
        }

        return getDefaultResources();
    }

    private List<Roadmap.RoadmapResource> getDefaultResources() {
        return Arrays.asList(
                createResource("MDN Web Docs", "doc", "https://developer.mozilla.org/"),
                createResource("Stack Overflow Community", "article", "https://stackoverflow.com/"),
                createResource("GitHub Trending", "article", "https://github.com/trending"),
                createResource("Dev.to Community", "article", "https://dev.to/"),
                createResource("LeetCode Practice", "challenge", "https://leetcode.com/")
        );
    }
}
