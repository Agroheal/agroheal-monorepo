// Auto-generated comprehensive Course Catalog for AgroHeal Admin & Web Academy
export interface CourseLesson {
  id: string;
  title: string;
  duration: string;
  videoId?: string;
  url?: string;
  description?: string;
}

export interface AdminCourse {
  id: string;
  title: string;
  slug: string;
  category: string;
  duration: string;
  lessonsCount: number;
  rating: number;
  description: string;
  status: "published" | "draft";
  lessons: CourseLesson[];
}

export const ADMIN_COURSES_CATALOG: AdminCourse[] = [
  {
    "id": "0",
    "title": "100-Day Container Garden Challenge",
    "slug": "100-day-container-garden-challenge",
    "category": "100-DAY CONTAINER GARDEN CHALLENGE",
    "duration": "1h 32m",
    "lessonsCount": 2,
    "rating": 5,
    "description": "A practical challenge to grow food in containers with weekly guidance and real impact.",
    "status": "published",
    "lessons": [
      {
        "id": "0-1",
        "title": "Day 1",
        "duration": "52:39",
        "videoId": "yMSHPl11JHI"
      },
      {
        "id": "0-2",
        "title": "Day 2",
        "duration": "39:40",
        "videoId": "Ofnxbj9qtdM"
      }
    ]
  },
  {
    "id": "1",
    "title": "Introduction to Organic Farming",
    "slug": "introduction-to-organic-farming",
    "category": "Introduction to Organic Farming",
    "duration": "2h 30m",
    "lessonsCount": 12,
    "rating": 4.9,
    "description": "Learn the fundamentals of organic agriculture and sustainable practices.",
    "status": "published",
    "lessons": [
      {
        "id": "1-1",
        "title": "What is Organic Farming?",
        "duration": "15:00",
        "videoId": "lwMEHx2os_8"
      },
      {
        "id": "1-2",
        "title": "Why should I practice organic Farming?",
        "duration": "18:00",
        "videoId": "1AVWqQuBkMg"
      },
      {
        "id": "1-3",
        "title": "How do I practice organic farming?",
        "duration": "20:00",
        "videoId": "vyow0ipo8_g"
      },
      {
        "id": "1-4",
        "title": "What are the Nutrients I Must feed my soil to Have Nutrient-dense plants and Bountiful Harvest",
        "duration": "22:00",
        "videoId": "9McB4jF9yI0"
      },
      {
        "id": "1-5",
        "title": "How do I protect my plants from pests and diseases that could reduce my yield or ruin my harvest?",
        "duration": "25:00",
        "videoId": "gXkO1rLEa4k"
      },
      {
        "id": "1-6",
        "title": "What are Biofertilizers and Biopesticides, their constituents and benefits to my plants?",
        "duration": "18:00",
        "videoId": "8p4w42rLbdU"
      },
      {
        "id": "1-7",
        "title": "What are Organic fertilizers and Organic pesticides, their Constituents, and Benefits to my Plants?",
        "duration": "20:00",
        "videoId": "VSQPyRvgktc"
      },
      {
        "id": "1-8",
        "title": "What are the benefits of integrating my plants with livestock?",
        "duration": "12:00",
        "videoId": "xJeV7AQmSCE"
      },
      {
        "id": "1-9",
        "title": "How do I raise Chicken, Fish and Snails to maturity and also produce their feed and immune boosters?",
        "duration": "12:00",
        "videoId": "_Bm3faRLSyg"
      },
      {
        "id": "1-10",
        "title": "How do I produce Biogas with the byproduct of bio-slurry fertilizer?",
        "duration": "12:00",
        "videoId": "DukS19fPw-E"
      },
      {
        "id": "1-11",
        "title": "What is the most basic layout for raised Garden beds, Garden containers, Plant nursery and Irrigation?",
        "duration": "12:00",
        "videoId": "Y5hR9w3_z50"
      },
      {
        "id": "1-12",
        "title": "What is the Seed to Harvest planting guide for tomatoes, hot pepper, sweet pepper, onions, cucumbers, okra, ugwu (pumpkin leaves), ewedu (jute leaves), tete (green amaranth), sweet potatoes and yams?",
        "duration": "12:00",
        "videoId": "a_FKpKXryvc"
      }
    ]
  },
  {
    "id": "2",
    "title": "Biofertilizer Production",
    "slug": "biofertilizer-production",
    "category": "Biofertilizers Production",
    "duration": "0h 56m",
    "lessonsCount": 5,
    "rating": 4.8,
    "description": "Formulate indigenous microorganisms, lactic acid bacteria, and mycorrhiza to supercharge soil biology.",
    "status": "published",
    "lessons": [
      {
        "id": "2-1",
        "title": "Video 1: Production of beneficial Microbes - IMO",
        "duration": "15:00",
        "videoId": "_1i_2BXi4Y4"
      },
      {
        "id": "2-2",
        "title": "Video 2: Production of beneficial Microbes - LAB",
        "duration": "20:35",
        "videoId": "NTqr2TZRRvE"
      },
      {
        "id": "2-3",
        "title": "Video 3: Production of beneficial Microbes - Mycorrhiza",
        "duration": "7:44",
        "videoId": "GvRzlBiPsEk"
      },
      {
        "id": "2-4",
        "title": "Video 4: Production of beneficial Microbes - Pseudomonas",
        "duration": "7:17",
        "videoId": "BneHjfqI-xU"
      },
      {
        "id": "2-5",
        "title": "Video 5: Production of beneficial Microbes - Cyanobacteria",
        "duration": "4:34",
        "videoId": "jiy4qQfNJPw"
      }
    ]
  },
  {
    "id": "3",
    "title": "Composting",
    "slug": "Composting",
    "category": "Composting",
    "duration": "1h 40m",
    "lessonsCount": 3,
    "rating": 4.7,
    "description": "Master aerated bucket composting, garden beds, and thermophilic organic decomposition.",
    "status": "published",
    "lessons": [
      {
        "id": "3-1",
        "title": "Audio: Composting By Esther Adetayo",
        "duration": "32:06",
        "videoId": "Bak4kUe6Vuw"
      },
      {
        "id": "3-2",
        "title": "Video 1: Bucket Composting",
        "duration": "30:32",
        "videoId": "sF1XqLRvj4s"
      },
      {
        "id": "3-3",
        "title": "Video 2: Garden Composting",
        "duration": "23:21",
        "videoId": "ZMVcs753KjA"
      }
    ]
  },
  {
    "id": "4",
    "title": "Black Soldier Fly Larvae",
    "slug": "bkack-soldier-fly-larvae",
    "category": "Black Soldier Fly Larvae",
    "duration": "1h 05m",
    "lessonsCount": 4,
    "rating": 4.7,
    "description": "Breed black soldier fly larvae for sustainable high-protein animal feed and rich frass fertilizer.",
    "status": "published",
    "lessons": [
      {
        "id": "4-1",
        "title": "Black Soldier Fly Larvae farming and the strategic advantage it gives an Organic farmer.",
        "duration": "32:06",
        "videoId": "lbBNzCkj3y0"
      },
      {
        "id": "4-2",
        "title": "Video 2: Black Soldier Fly Production Stages",
        "duration": "30:32",
        "videoId": "LTazdkGrvDc"
      },
      {
        "id": "4-3",
        "title": "Video 3: Black Soldier Fly Larvae Production: Profit Potential, Marketing Tips And Production Guide",
        "duration": "23:21",
        "videoId": "Z_ynq3kJQrU"
      },
      {
        "id": "4-4",
        "title": "Video 4: Black Soldier Fly Larvae Production: How To Use Frass Organic Fertilizer",
        "duration": "06:31",
        "videoId": "WgwPTICUmiM"
      }
    ]
  },
  {
    "id": "5",
    "title": "Organic Fertilizer Production",
    "slug": "organic-fertilizer-production",
    "category": "Organic Fertilizer Production",
    "duration": "0h 44m",
    "lessonsCount": 4,
    "rating": 4.7,
    "description": "Produce liquid compost tea, fermented fruit attractants, and multivitamin soil enhancers.",
    "status": "published",
    "lessons": [
      {
        "id": "5-1",
        "title": "Video 1: Production of Organic Fertilizer (Compost)",
        "duration": "15:38",
        "videoId": "8ic3X-8OUdA"
      },
      {
        "id": "5-2",
        "title": "Video 2: Production of Organic Fertilizer (Fermented Manure Tea)",
        "duration": "07:42",
        "videoId": "XnU2Da9yhnQ"
      },
      {
        "id": "5-3",
        "title": "Video 3: Production of Organic Fertilizer (Fermented Fruit Juice Attractant)",
        "duration": "04:46",
        "videoId": "_S5XKMAJZA8"
      },
      {
        "id": "5-3",
        "title": "Video 4: Production of Organic Fertilizer (Fermented Fruit Juice Multivitamin)",
        "duration": "15:58",
        "videoId": "IXo6Cb7oQ5E"
      }
    ]
  },
  {
    "id": "6",
    "title": "Biochar Production",
    "slug": "biochar-production",
    "category": "Biochar Production",
    "duration": "0h 26m",
    "lessonsCount": 1,
    "rating": 4.7,
    "description": "Utilize biomass pyrolysis to produce high-grade biochar for moisture and soil nutrient retention.",
    "status": "published",
    "lessons": [
      {
        "id": "6-1",
        "title": "Video: Production of Biochar",
        "duration": "26:00",
        "videoId": "rw6xug2QcWQ"
      }
    ]
  },
  {
    "id": "7",
    "title": "Organic Pesticide Production",
    "slug": "organic-pesticide-production",
    "category": "Organic Pesticide Production",
    "duration": "0h 17m",
    "lessonsCount": 3,
    "rating": 4.7,
    "description": "How to produce organic pesticide.",
    "status": "published",
    "lessons": [
      {
        "id": "7-1",
        "title": "Video 1: Production of Organic Pesticide (GINGER-GARLIC)",
        "duration": "05:47",
        "videoId": "cmdp29WAUQM"
      },
      {
        "id": "7-2",
        "title": "Video 2: Production of Organic Pesticide (CHILI PEPPER-GARLIC)",
        "duration": "04:35",
        "videoId": "EBunr-PwEcg"
      },
      {
        "id": "7-3",
        "title": "Video 1: Production of Organic Pesticide (NEEM EXTRACT)",
        "duration": "07:07",
        "videoId": "aCfwqNngWKE"
      }
    ]
  },
  {
    "id": "8",
    "title": "Organic Garden Practicals",
    "slug": "organic-garden-practicals",
    "category": "Organic Garden Practicals",
    "duration": "0h 35m",
    "lessonsCount": 5,
    "rating": 4.7,
    "description": "Organic Garden Practicals .",
    "status": "published",
    "lessons": [
      {
        "id": "8-1",
        "title": "Video 1: Introduction to Organic Farming and The Basics of Plant and Animal Nutrition.",
        "duration": "04:42",
        "videoId": "rKom6PawdZ0"
      },
      {
        "id": "8-2",
        "title": "Video 2: How to Make a Well-Nourished Container Soil Mix For Fruity Vegetables.",
        "duration": "05:29",
        "videoId": "JP4JXB5edf8"
      },
      {
        "id": "8-3",
        "title": "Video 3: How to Make a Well-Nourished Soil Mix for Leafy Vegetables.",
        "duration": "02:34",
        "videoId": "LryhsDoUm6Q"
      },
      {
        "id": "8-4",
        "title": "Video 4: How to Prepare Raised Beds for Garden Farming.",
        "duration": "02:47",
        "videoId": "vUvNo4qLupY"
      },
      {
        "id": "8-5",
        "title": "Video 5: Organic Garden Layout And Livestock Housing For 12 By 12 Template.",
        "duration": "19:30",
        "videoId": "pC_M0I1Dgo0"
      }
    ]
  },
  {
    "id": "9",
    "title": "Mushroom Farming",
    "slug": "mushroom-farming",
    "category": "Mushroom Farming",
    "duration": "5h 21m",
    "lessonsCount": 5,
    "rating": 4.7,
    "description": "How to plant mushroom.",
    "status": "published",
    "lessons": [
      {
        "id": "9-1",
        "title": "Audio-video 1: Mushroom Masterclass Day 1 (Audio 1)",
        "duration": "01:23:50",
        "videoId": "pUS3M-0SPeQ"
      },
      {
        "id": "9-2",
        "title": "Audio-video 2: Mushroom Masterclass Day 1 (Audio 2)",
        "duration": "01:18:14",
        "videoId": "s7LZPZ2PrbI"
      },
      {
        "id": "9-3",
        "title": "Audio-video 3: Mushroom Masterclass Day 1 (Audio 3)",
        "duration": "01:17:00",
        "videoId": "_cInrf8yjy4"
      },
      {
        "id": "9-4",
        "title": "Audio-video 4: Mushroom Masterclass Day 2 (Q & A)",
        "duration": "52:03",
        "videoId": "b5f8C2B50ug"
      },
      {
        "id": "9-5",
        "title": "Video: Mushroom Masterclass Practical",
        "duration": "46:59",
        "videoId": "csOvJj_cvS8"
      }
    ]
  },
  {
    "id": "10",
    "title": "Tomato Farming",
    "slug": "tomato-farming",
    "category": "Tomato Farming",
    "duration": "5h 03m",
    "lessonsCount": 5,
    "rating": 4.9,
    "description": "How to plant tomato from seed to harvest.",
    "status": "published",
    "lessons": [
      {
        "id": "10-1",
        "title": "Audio-video 1: Precision Tomato Farming Techniques and Profitability",
        "duration": "01:26:31",
        "videoId": "6ThQo4E-XkA"
      },
      {
        "id": "10-2",
        "title": "Audio-video 2: Organic Tomato Production Practical Training",
        "duration": "01:07:59",
        "videoId": "HbiDrhrSM-I"
      },
      {
        "id": "10-3",
        "title": "Audio-video 3: Organic Tomato Farming: Seed, Pest, Disease, Nutrition",
        "duration": "01:16:32",
        "videoId": "5CAKc_2i5tc"
      },
      {
        "id": "10-4",
        "title": "Audio-video 4: Comprehensive Tomato Cultivation and Disease Management.",
        "duration": "01:07:35",
        "videoId": "jmKGPKKVXxY"
      },
      {
        "id": "10-5",
        "title": "Video: How To Grow Organic Tomatoes in Net Grow Bags or Garden Beds.",
        "duration": "05:32",
        "videoId": "3tJCjQcS0I4"
      }
    ]
  },
  {
    "id": "11",
    "title": "Ugu Farming",
    "slug": "ugu-farming",
    "category": "Ugu Farming",
    "duration": "4h 05m",
    "lessonsCount": 5,
    "rating": 4.6,
    "description": "Fluted Pumpkin Multiplication Simplified.",
    "status": "published",
    "lessons": [
      {
        "id": "11-1",
        "title": "Ugu Seeds: Fluted Pumpkin Multiplication Simplified.",
        "duration": "03:11",
        "videoId": "zEkboWcurME"
      },
      {
        "id": "11-2",
        "title": "Audio-video 2: Ugu (Fluted Pumpkin) Masterclass: Seed Multiplication System.",
        "duration": "01:21:48",
        "videoId": "6cmK0BFjGsg"
      },
      {
        "id": "11-3",
        "title": "Audio-video 3: Ugu Masterclass: Ugu Multiplication Techniques.",
        "duration": "01:15:20",
        "videoId": "-lIwRR2lz_A"
      },
      {
        "id": "11-4",
        "title": "Audio-video 4: Ugu Masterclass: Organic Pest And Disease Control.",
        "duration": "01:23:04",
        "videoId": "2d34lfe34fk"
      },
      {
        "id": "11-5",
        "title": "Video: How To Plant Ugu (Fluted Pumpkin).",
        "duration": "04:53",
        "videoId": "rgi8ds3uqaA"
      }
    ]
  },
  {
    "id": "12",
    "title": "Pepper Farming",
    "slug": "pepper-farming",
    "category": "Pepper Farming",
    "duration": "0h 3m",
    "lessonsCount": 1,
    "rating": 4.8,
    "description": " How To Grow Hot Pepper in Containers and Garden Beds.",
    "status": "published",
    "lessons": [
      {
        "id": "12-1",
        "title": "Pepper Farming",
        "duration": "18:00",
        "videoId": "wo_mCDFyNrQ"
      }
    ]
  },
  {
    "id": "13",
    "title": "⁠Shoko, Tete and Ewedu Farming",
    "slug": "shoko-tete-&-ewedu-farming",
    "category": "⁠Shoko, Tete and Ewedu Farming",
    "duration": "0h 3m",
    "lessonsCount": 1,
    "rating": 4.8,
    "description": "How to Grow Amaranthus (Tete), Celosia (Shoko), and Corchorus (Ewedu) Vegetables.",
    "status": "published",
    "lessons": [
      {
        "id": "13-1",
        "title": "Shoko, Tete, and Ewedu Farming",
        "duration": "18:00",
        "videoId": "LRR8IvuofzY"
      }
    ]
  },
  {
    "id": "14",
    "title": "How to plant Maize step by step",
    "slug": "maize-farming",
    "category": "Maize Farming",
    "duration": "0h 4m",
    "lessonsCount": 1,
    "rating": 4.8,
    "description": "How To Plant Maize from Seeds To Harvest (A Simple Step-By-Step Guide).",
    "status": "published",
    "lessons": [
      {
        "id": "14-1",
        "title": "Maize Farming",
        "duration": "18:00",
        "videoId": "arATAxMcnG0"
      }
    ]
  },
  {
    "id": "15",
    "title": "Cucumber Farming",
    "slug": "cucumber-farming",
    "category": "Cucumber Farming",
    "duration": "0h 3m",
    "lessonsCount": 1,
    "rating": 4.8,
    "description": " How To Grow Cucumber From Seed To Harvest.",
    "status": "published",
    "lessons": [
      {
        "id": "15-1",
        "title": "Cucumber Farming",
        "duration": "18:00",
        "videoId": "qEWUNI7X5og"
      }
    ]
  },
  {
    "id": "16",
    "title": "Watermelon Farming",
    "slug": "watermelon-farming",
    "category": "Watermelon Farming",
    "duration": "0h 4m",
    "lessonsCount": 1,
    "rating": 4.8,
    "description": "Video: How To Grow Watermelon From Seed To Harvest",
    "status": "published",
    "lessons": [
      {
        "id": "16-1",
        "title": "How to Grow Water Melon",
        "duration": "18:00",
        "videoId": "y2Hg6gSFbuM"
      }
    ]
  },
  {
    "id": "17",
    "title": "Broiler Chicken Farming",
    "slug": "production-of-organic-chicken",
    "category": "Broiler Chicken Farming",
    "duration": "0h 25m",
    "lessonsCount": 1,
    "rating": 4.8,
    "description": "Production of Organic Chicken, Immune Boosters, and Chicken Feed",
    "status": "published",
    "lessons": [
      {
        "id": "17-1",
        "title": "Broiler Chicken Farming",
        "duration": "18:00",
        "videoId": "PYnaF2JCSoc"
      }
    ]
  },
  {
    "id": "18",
    "title": "Sweet Potato Farming",
    "slug": "sweet-potato-farming",
    "category": "Sweet Potato Farming",
    "duration": "0h 4m",
    "lessonsCount": 1,
    "rating": 4.8,
    "description": "Best practices for planting and harvesting potato in a stack.",
    "status": "published",
    "lessons": [
      {
        "id": "18-1",
        "title": "Sweet Potato Farming",
        "duration": "18:00",
        "videoId": "Ii0Zp91mtKw"
      }
    ]
  },
  {
    "id": "19",
    "title": "Yam Farming",
    "slug": "how-to-grow-yam",
    "category": "Yam Farming",
    "duration": "0h 3m",
    "lessonsCount": 1,
    "rating": 4.8,
    "description": "Best practices for planting and harvesting yam in a heap and stack.",
    "status": "published",
    "lessons": [
      {
        "id": "19-1",
        "title": "Yam Farming",
        "duration": "18:00",
        "videoId": "OfAq4BA5jIw"
      }
    ]
  },
  {
    "id": "20",
    "title": "Cassava Farming",
    "slug": "how-to-grow-cassava",
    "category": "Cassava Farming",
    "duration": "0h 2m",
    "lessonsCount": 1,
    "rating": 4.8,
    "description": "Best practices for planting and harvesting cassava from seed to harvest.",
    "status": "published",
    "lessons": [
      {
        "id": "20-1",
        "title": "How To Grow Cassava (Planting To Harvest).",
        "duration": "18:00",
        "videoId": "qeG99nagHYc"
      }
    ]
  },
  {
    "id": "21",
    "title": "Beans Farming",
    "slug": "how-to-grow-beans-step-by-step",
    "category": "Beans Farming",
    "duration": "0h 3m",
    "lessonsCount": 1,
    "rating": 4.8,
    "description": "Best practices for planting and harvesting beans from seed to harvest.",
    "status": "published",
    "lessons": [
      {
        "id": "21-1",
        "title": "How to grow beans step by step",
        "duration": "18:00",
        "videoId": "TprAbsdG8sM"
      }
    ]
  },
  {
    "id": "22",
    "title": "Soybeans Farming",
    "slug": "how-to-grow-soyabeans-from-seed-to-harvest",
    "category": "Soybeans Farming",
    "duration": "0h 3m",
    "lessonsCount": 1,
    "rating": 4.8,
    "description": "Best practices for planting and harvesting soyabeans from seed to harvest.",
    "status": "published",
    "lessons": [
      {
        "id": "22-1",
        "title": "How to grow soyabeans from seed to harvest",
        "duration": "18:00",
        "videoId": "-3JbC96JEqI"
      }
    ]
  },
  {
    "id": "23",
    "title": "Ginger and Pepper Webinar",
    "slug": "ginger-&-pepper-webinar",
    "category": "Giniger and Pepper Webinar",
    "duration": "0h 3m",
    "lessonsCount": 1,
    "rating": 4.8,
    "description": "Indepth training about ginger and peper.",
    "status": "published",
    "lessons": [
      {
        "id": "23-1",
        "title": "ginger and pepper webinar",
        "duration": "18:00",
        "videoId": "MdE2pqeVjJ8"
      }
    ]
  }
];
