export interface Lesson {
  id: string;
  title: string;
  duration: string;
  videoId: string; // YouTube video ID
}

export interface Course {
  id: number;
  slug: string;
  title: string;
  description: string;
  duration: string;
  lessons: Lesson[];
  rating: number;
  free: boolean;
  category: string;
}

export const courses: Course[] = [
  {
    id: 0,
    slug: "100-day-container-garden-challenge",
    title: "100-Day Container Garden Challenge",
    description:
      "A practical challenge to grow food in containers with weekly guidance and real impact.",
    duration: "0h 52m",
    lessons: [
      { id: "0-1", title: "Day 1", duration: "52:39", videoId: "yMSHPl11JHI" },
    ],
    rating: 5.0,
    free: true,
    category: "100-DAY CONTAINER GARDEN CHALLENGE",
  },
  {
    id: 1,
    slug: "introduction-to-organic-farming",
    title: "Introduction to Organic Farming",
    description:
      "Learn the fundamentals of organic agriculture and sustainable practices.",
    duration: "2h 30m",
    lessons: [
      {
        id: "1-1",
        title: "What is Organic Farming?",
        duration: "12:00",
        videoId: "lwMEHx2os_8",
      },
      {
        id: "1-2",
        title: "Why should I practice organic Farming?",
        duration: "12:10",
        videoId: "1AVWqQuBkMg",
      },
      {
        id: "1-3",
        title: "How do I practice organic farming?",
        duration: "17:35",
        videoId: "vyow0ipo8_g",
      },
      {
        id: "1-4",
        title:
          "What are the Nutrients I Must feed my soil to Have Nutrient-dense plants and Bountiful Harvest",
        duration: "9:09",
        videoId: "9McB4jF9yI0",
      },
      {
        id: "1-5",
        title:
          "How do I protect my plants from pests and diseases that could reduce my yield or ruin my harvest?",
        duration: "6:11",
        videoId: "gXkO1rLEa4k",
      },
      {
        id: "1-6",
        title:
          "What are Biofertilizers and Biopesticides, their constituents and benefits to my plants?",
        duration: "7:33",
        videoId: "8p4w42rLbdU",
      },
      {
        id: "1-7",
        title:
          "What are Organic fertilizers and Organic pesticides, their Constituents, and Benefits to my Plants?",
        duration: "34:01",
        videoId: "VSQPyRvgktc",
      },
      {
        id: "1-8",
        title: "What are the benefits of integrating my plants with livestock?",
        duration: "6:00",
        videoId: "xJeV7AQmSCE",
      },
      {
        id: "1-9",
        title:
          "How do I raise Chicken, Fish and Snails to maturity and also produce their feed and immune boosters?",
        duration: "9:15",
        videoId: "_Bm3faRLSyg",
      },
      {
        id: "1-10",
        title:
          "How do I produce Biogas with the byproduct of bio-slurry fertilizer?",
        duration: "21:36",
        videoId: "DukS19fPw-E",
      },
      {
        id: "1-11",
        title:
          "What is the most basic layout for raised Garden beds, Garden containers, Plant nursery and Irrigation?",
        duration: "11:52",
        videoId: "Y5hR9w3_z50",
      },
      {
        id: "1-12",
        title:
          "What is the Seed to Harvest planting guide for tomatoes, hot pepper, sweet pepper, onions, cucumbers, okra, ugwu (pumpkin leaves), ewedu (jute leaves), tete (green amaranth), sweet potatoes and yams?",
        duration: "26:42",
        videoId: "a_FKpKXryvc",
      },
    ],
    rating: 4.9,
    free: true,
    category: "Introduction to Organic Farming",
  },
  {
    id: 2,
    slug: "biofertilizer-production",
    title: "Biofertilizer Production",
    description: "Learn more about Biofertilizer Production",
    duration: "3h 15m",
    lessons: [
      {
        id: "2-1",
        title: "Video 1: Production of beneficial Microbes - IMO",
        duration: "15:02",
        videoId: "_1i_2BXi4Y4",
      },
      {
        id: "2-2",
        title: "Video 2: Production of beneficial Microbes - LAB",
        duration: "20:35",
        videoId: "NTqr2TZRRvE",
      },
      {
        id: "2-3",
        title: "Video 3: Production of beneficial Microbes - Mycorrhiza",
        duration: "7:44",
        videoId: "GvRzlBiPsEk",
      },
      {
        id: "2-4",
        title: "Video 4: Production of beneficial Microbes - Pseudomonas",
        duration: "7:17",
        videoId: "BneHjfqI-xU",
      },
      {
        id: "2-5",
        title: "Video 5: Production of beneficial Microbes - Cyanobacteria",
        duration: "4:34",
        videoId: "jiy4qQfNJPw",
      },
    ],
    rating: 4.8,
    free: true,
    category: "Biofertilizers Production",
  },
  {
    id: 3,
    slug: "Composting",
    title: "Composting",
    description: "Learn more about composing.",
    duration: "2h 45m",
    lessons: [
      {
        id: "3-1",
        title: "Audio: Composting By Esther Adetayo",
        duration: "1:28:03",
        videoId: "Bak4kUe6Vuw",
      },
      {
        id: "3-2",
        title: "Video 1: Bucket Composting",
        duration: "4:21",
        videoId: "sF1XqLRvj4s",
      },
      {
        id: "3-3",
        title: "Video 2: Garden Composting",
        duration: "6:53",
        videoId: "ZMVcs753KjA",
      },
    ],
    rating: 4.7,
    free: true,
    category: "Composting",
  },
  {
    id: 4,
    slug: "bkack-soldier-fly-larvae",
    title: "Black Soldier Fly Larvae",
    description: "Black soldier fly larvae.",
    duration: "2h 45m",
    lessons: [
      {
        id: "4-1",
        title:
          "Black Soldier Fly Larvae farming and the strategic advantage it gives an Organic farmer.",
        duration: "32:06",
        videoId: "lbBNzCkj3y0",
      },
      {
        id: "4-2",
        title: "Video 2: Black Soldier Fly Production Stages",
        duration: "30:32",
        videoId: "LTazdkGrvDc",
      },
      {
        id: "4-3",
        title:
          "Video 3: Black Soldier Fly Larvae Production: Profit Potential, Marketing Tips And Production Guide",
        duration: "23:21",
        videoId: "Z_ynq3kJQrU",
      },
      {
        id: "4-4",
        title:
          "Video 4: Black Soldier Fly Larvae Production: How To Use Frass Organic Fertilizer",
        duration: "6:31",
        videoId: "WgwPTICUmiM",
      },
    ],
    rating: 4.7,
    free: true,
    category: "Black Soldier Fly Larvae",
  },
  {
    id: 5,
    slug: "organic-fertilizer-production",
    title: "Organic Fertilizer Production",
    description: "How to produce organic fertilizers.",
    duration: "2h 45m",
    lessons: [
      {
        id: "5-1",
        title: "Video 1: Production of Organic Fertilizer (Compost)",
        duration: "15:38",
        videoId: "8ic3X-8OUdA",
      },
      {
        id: "5-2",
        title:
          "Video 2: Production of Organic Fertilizer (Fermented Manure Tea)",
        duration: "7:42",
        videoId: "XnU2Da9yhnQ",
      },
      {
        id: "5-3",
        title:
          "Video 3: Production of Organic Fertilizer (Fermented Fruit Juice Attractant)",
        duration: "4:46",
        videoId: "_S5XKMAJZA8",
      },
      {
        id: "5-4",
        title:
          "Video 4: Production of Organic Fertilizer (Fermented Fruit Juice Multivitamin)",
        duration: "15:58",
        videoId: "IXo6Cb7oQ5E",
      },
    ],
    rating: 4.7,
    free: true,
    category: "Organic Fertilizer Production",
  },
  {
    id: 6,
    slug: "biochar-production",
    title: "Biochar Production",
    description: "How to produce biochar.",
    duration: "00h 26m",
    lessons: [
      {
        id: "6-1",
        title: "Video: Production of Biochar",
        duration: "26:39",
        videoId: "rw6xug2QcWQ",
      },
    ],
    rating: 4.7,
    free: true,
    category: "Biochar Production",
  },
  {
    id: 7,
    slug: "organic-pesticide-production",
    title: "Organic Pesticide Production",
    description: "How to produce organic pesticide.",
    duration: "2h 45m",
    lessons: [
      {
        id: "7-1",
        title: "Video 1: Production of Organic Pesticide (GINGER-GARLIC)",
        duration: "5:47",
        videoId: "cmdp29WAUQM",
      },
      {
        id: "7-2",
        title: "Video 2: Production of Organic Pesticide (CHILI PEPPER-GARLIC)",
        duration: "4:35",
        videoId: "EBunr-PwEcg",
      },
      {
        id: "7-3",
        title: "Video 1: Production of Organic Pesticide (NEEM EXTRACT)",
        duration: "7:07",
        videoId: "aCfwqNngWKE",
      },
    ],
    rating: 4.7,
    free: true,
    category: "Organic Pesticide Production",
  },
  {
    id: 8,
    slug: "organic-garden-practicals",
    title: "Organic Garden Practicals",
    description: "Organic Garden Practicals .",
    duration: "2h 45m",
    lessons: [
      {
        id: "8-1",
        title:
          "Video 1: Introduction to Organic Farming and The Basics of Plant and Animal Nutrition.",
        duration: "4:42",
        videoId: "rKom6PawdZ0",
      },
      {
        id: "8-2",
        title:
          "Video 2: How to Make a Well-Nourished Container Soil Mix For Fruity Vegetables.",
        duration: "5:28",
        videoId: "JP4JXB5edf8",
      },
      {
        id: "8-3",
        title:
          "Video 3: How to Make a Well-Nourished Soil Mix for Leafy Vegetables.",
        duration: "2:34",
        videoId: "LryhsDoUm6Q",
      },
      {
        id: "8-4",
        title: "Video 4: How to Prepare Raised Beds for Garden Farming.",
        duration: "2:47",
        videoId: "vUvNo4qLupY",
      },
      {
        id: "8-5",
        title:
          "Video 5: Organic Garden Layout And Livestock Housing For 12 By 12 Template.",
        duration: "19:30",
        videoId: "pC_M0I1Dgo0",
      },
    ],
    rating: 4.7,
    free: true,
    category: "Organic Garden Practicals",
  },
  {
    id: 9,
    slug: "mushroom-farming",
    title: "Mushroom Farming",
    description: "How to plant mushroom.",
    duration: "5h 45m",
    lessons: [
      {
        id: "9-1",
        title: "Audio-video 1: Mushroom Masterclass Day 1 (Audio 1)",
        duration: "01:23:50",
        videoId: "pUS3M-0SPeQ",
      },
      {
        id: "9-2",
        title: "Audio-video 2: Mushroom Masterclass Day 1 (Audio 2)",
        duration: "01:18:14",
        videoId: "s7LZPZ2PrbI",
      },
      {
        id: "9-3",
        title: "Audio-video 3: Mushroom Masterclass Day 1 (Audio 3)",
        duration: "1:17:00",
        videoId: "_cInrf8yjy4",
      },
      {
        id: "9-4",
        title: "Audio-video 4: Mushroom Masterclass Day 2 (Q & A)",
        duration: "52:03",
        videoId: "b5f8C2B50ug",
      },
      {
        id: "9-5",
        title: "Video: Mushroom Masterclass Practical",
        duration: "46:59",
        videoId: "csOvJj_cvS8",
      },
    ],
    rating: 4.7,
    free: true,
    category: "Mushroom Farming",
  },
  {
    id: 10,
    slug: "tomato-farming",
    title: "Tomato Farming",
    description: "How to plant tomato from seed to harvest.",
    duration: "4h 00m",
    lessons: [
      {
        id: "10-1",
        title:
          "Audio-video 1: Precision Tomato Farming Techniques and Profitability",
        duration: "01:26:31",
        videoId: "6ThQo4E-XkA",
      },
      {
        id: "10-2",
        title: "Audio-video 2: Organic Tomato Production Practical Training",
        duration: "01:07:59",
        videoId: "HbiDrhrSM-I",
      },
      {
        id: "10-3",
        title:
          "Audio-video 3: Organic Tomato Farming: Seed, Pest, Disease, Nutrition",
        duration: "01:16:32",
        videoId: "5CAKc_2i5tc",
      },
      {
        id: "10-4",
        title:
          "Audio-video 4: Comprehensive Tomato Cultivation and Disease Management.",
        duration: "01:07:35",
        videoId: "jmKGPKKVXxY",
      },
      {
        id: "10-5",
        title:
          "Video: How To Grow Organic Tomatoes in Net Grow Bags or Garden Beds.",
        duration: "5:31",
        videoId: "3tJCjQcS0I4",
      },
    ],
    rating: 4.9,
    free: true,
    category: "Tomato Farming",
  },
  {
    id: 11,
    slug: "ugu-farming",
    title: "Ugu Farming",
    description: "Fluted Pumpkin Multiplication Simplified.",
    duration: "2h 00m",
    lessons: [
      {
        id: "11-1",
        title: " Ugu Seeds: Fluted Pumpkin Multiplication Simplified.",
        duration: "3:11",
        videoId: "zEkboWcurME",
      },
      {
        id: "11-2",
        title:
          "Audio-video 2: Ugu (Fluted Pumpkin) Masterclass: Seed Multiplication System.",
        duration: "1:21:48",
        videoId: "6cmK0BFjGsg",
      },
      {
        id: "11-3",
        title: "Audio-video 3: Ugu Masterclass: Ugu Multiplication Techniques.",
        duration: "1:15:21",
        videoId: "-lIwRR2lz_A",
      },
      {
        id: "11-4",
        title:
          "Audio-video 4: Ugu Masterclass: Organic Pest And Disease Control.",
        duration: "1:23:04",
        videoId: "2d34lfe34fk",
      },
      {
        id: "11-5",
        title: "Video: How To Plant Ugu (Fluted Pumpkin).",
        duration: "4:25",
        videoId: "rgi8ds3uqaA",
      },
    ],
    rating: 4.6,
    free: true,
    category: "Ugu Farming",
  },
  {
    id: 12,
    slug: "pepper-farming",
    title: "Pepper Farming",
    description: " How To Grow Hot Pepper in Containers and Garden Beds.",
    duration: "0h 3m",
    lessons: [
      {
        id: "12-1",
        title: "Pepper Farming",
        duration: "3:12",
        videoId: "wo_mCDFyNrQ",
      },
    ],
    rating: 4.8,
    free: true,
    category: "Pepper Farming",
  },
  {
    id: 13,
    slug: "shoko-tete-&-ewedu-farming",
    title: "Shoko, Tete, and Ewedu Farming",
    description:
      "How to Grow Amaranthus (Tete), Celosia (Shoko), and Corchorus (Ewedu) Vegetables.",
    duration: "0h 3m",
    lessons: [
      {
        id: "13-1",
        title: "Shoko, Tete, and Ewedu Farming",
        duration: "3:30",
        videoId: "LRR8IvuofzY",
      },
    ],
    rating: 4.8,
    free: true,
    category: "Shoko Tete and Ewedu",
  },
  {
    id: 14,
    slug: "maize-farming",
    title: "How to plant Maize step by step",
    description:
      "How To Plant Maize from Seeds To Harvest (A Simple Step-By-Step Guide).",
    duration: "0h 4m",
    lessons: [
      {
        id: "14-1",
        title: "Maize Farming",
        duration: "3:50",
        videoId: "arATAxMcnG0",
      },
    ],
    rating: 4.8,
    free: true,
    category: "Maize Farming",
  },
  {
    id: 15,
    slug: "cucumber-farming",
    title: "Cucumber Farming",
    description: " How To Grow Cucumber From Seed To Harvest.",
    duration: "0h 3m",
    lessons: [
      {
        id: "15-1",
        title: "Cucumber Farming",
        duration: "3:21",
        videoId: "qEWUNI7X5og",
      },
    ],
    rating: 4.8,
    free: true,
    category: "Cucumber Farming",
  },
  {
    id: 16,
    slug: "watermelon-farming",
    title: "Watermelon Farming",
    description: "Video: How To Grow Watermelon From Seed To Harvest",
    duration: "0h 4m",
    lessons: [
      {
        id: "16-1",
        title: "How to Grow Water Melon",
        duration: "4:11",
        videoId: "y2Hg6gSFbuM",
      },
    ],
    rating: 4.8,
    free: true,
    category: "Watermelon Farming",
  },
  {
    id: 17,
    slug: "production-of-organic-chicken",
    title: "Broiler Chicken Farming",
    description:
      "Production of Organic Chicken, Immune Boosters, and Chicken Feed",
    duration: "0h 25m",
    lessons: [
      {
        id: "17-1",
        title: "Broiler Chicken Farming",
        duration: "25:33",
        videoId: "PYnaF2JCSoc",
      },
    ],
    rating: 4.8,
    free: true,
    category: "Broiler Chicken Farming",
  },
  {
    id: 18,
    slug: "sweet-potato-farming",
    title: "Sweet Potato Farming",
    description:
      "Best practices for planting and harvesting potato in a stack.",
    duration: "0h 4m",
    lessons: [
      {
        id: "18-1",
        title: "Sweet Potato Farming",
        duration: "4:04",
        videoId: "Ii0Zp91mtKw",
      },
    ],
    rating: 4.8,
    free: true,
    category: "Sweet Potato",
  },
  {
    id: 19,
    slug: "how-to-grow-yam",
    title: "Yam Farming",
    description:
      "Best practices for planting and harvesting yam in a heap and stack.",
    duration: "0h 3m",
    lessons: [
      {
        id: "19-1",
        title: "Yam Farming",
        duration: "3:25",
        videoId: "OfAq4BA5jIw",
      },
    ],
    rating: 4.8,
    free: true,
    category: "Yam Farming",
  },
  {
    id: 20,
    slug: "how-to-grow-cassava",
    title: "Cassava Farming",
    description:
      "Best practices for planting and harvesting cassava from seed to harvest.",
    duration: "0h 2m",
    lessons: [
      {
        id: "20-1",
        title: "How To Grow Cassava (Planting To Harvest).",
        duration: "2:11",
        videoId: "qeG99nagHYc",
      },
    ],
    rating: 4.8,
    free: true,
    category: "Cassava Farming",
  },
  {
    id: 21,
    slug: "how-to-grow-beans-step-by-step",
    title: "Beans Farming",
    description:
      "Best practices for planting and harvesting beans from seed to harvest.",
    duration: "0h 3m",
    lessons: [
      {
        id: "21-1",
        title: "How to grow beans step by step",
        duration: "3:15",
        videoId: "TprAbsdG8sM",
      },
    ],
    rating: 4.8,
    free: true,
    category: "Beans Farming",
  },
  {
    id: 22,
    slug: "how-to-grow-soyabeans-from-seed-to-harvest",
    title: "Soyabeans Farming",
    description:
      "Best practices for planting and harvesting soyabeans from seed to harvest.",
    duration: "0h 3m",
    lessons: [
      {
        id: "22-1",
        title: "How to grow soyabeans from seed to harvest",
        duration: "3:03",
        videoId: "-3JbC96JEqI",
      },
    ],
    rating: 4.8,
    free: true,
    category: "Soyabeans",
  },
  {
    id: 23,
    slug: "ginger-&-pepper-webinar",
    title: "Ginger and Pepper Webinar",
    description: "Indepth training about ginger and peper.",
    duration: "0h 3m",
    lessons: [
      {
        id: "23-1",
        title: "ginger and pepper webinar",
        duration: "18:00",
        videoId: "MdE2pqeVjJ8",
      },
    ],
    rating: 4.8,
    free: true,
    category: "Giniger and Pepper Webinar",
  },
];

export const getCourseBySlug = (slug: string): Course | undefined => {
  return courses.find((course) => course.slug === slug);
};
