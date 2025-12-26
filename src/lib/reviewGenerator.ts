import { Review } from '@/types/review';
import { format, subDays, eachDayOfInterval } from 'date-fns';

// Sample review templates for generating realistic mock data
const REVIEW_TEMPLATES = {
  swiggy: {
    issues: [
      "Delivery was late by {time} minutes. Very disappointed.",
      "The food arrived cold and stale. Never ordering again.",
      "Delivery guy was extremely rude when I asked about the delay.",
      "App keeps crashing whenever I try to checkout.",
      "Payment failed multiple times, had to use different card.",
      "Received wrong order completely. Asked for biryani got pizza.",
      "Order got cancelled without any reason. Very frustrating.",
      "Still waiting for my refund from last week's cancelled order.",
      "GPS shows wrong location, delivery partner couldn't find me.",
      "Customer support kept me on hold for 30 minutes. No resolution.",
      "Food was spilled inside the bag. Packaging was terrible.",
      "Instamart order came with missing items. No refund.",
      "Maps not working properly, had to guide driver manually.",
      "The delivery person called multiple times even after clear instructions.",
      "Hygiene standards seem very low. Found hair in food.",
    ],
    requests: [
      "Please add more restaurants in my area. Options are limited.",
      "Delivery fees are too high. Should reduce for regular customers.",
      "Need better packaging for liquid items. Always spills.",
      "Would love a dark mode option. Current UI is too bright at night.",
      "Give better discounts like Zomato does.",
      "Instamart should be open all night for late orders.",
      "Bring back the 10 minute bolt delivery feature.",
      "Need more vegetarian restaurant options.",
      "Add feature to schedule orders in advance.",
      "Please add cash on delivery option for all orders.",
    ],
    feedback: [
      "Amazing service! Got my food in 20 minutes.",
      "Love the app interface. Very easy to use.",
      "Delivery partner was very polite and professional.",
      "Great discounts on first order. Will order again!",
      "Food quality has improved significantly.",
      "Best food delivery app in India. Highly recommended.",
      "Instamart is a lifesaver for grocery shopping.",
      "Customer support resolved my issue quickly.",
      "Packaging was excellent. Food arrived hot.",
      "Reasonable prices compared to other apps.",
    ],
  },
  zomato: {
    issues: [
      "Order delayed by {time} minutes. Unacceptable.",
      "Food was completely cold when it arrived.",
      "Delivery boy argued with me about the address.",
      "App freezes on payment screen every time.",
      "Card declined even though it works everywhere else.",
      "Got someone else's order. Very careless.",
      "My order was cancelled but money was deducted.",
      "Refund taking forever. It's been 2 weeks.",
      "Location pin keeps resetting. Very annoying.",
      "Customer care is non-existent. No response.",
      "Biryani leaked all over the bag.",
      "Items missing from Blinkit order regularly.",
      "Restaurant shown as open but order was rejected.",
      "Delivery partner asked for extra cash tip.",
      "Found an insect in the food. Disgusted.",
    ],
    requests: [
      "Need more local restaurant options.",
      "Reduce platform fee. It's too expensive now.",
      "Better packaging for curries please.",
      "Add AMOLED dark theme for battery saving.",
      "Match competitor discounts.",
      "24/7 grocery delivery would be great.",
      "Bring back Zomato Pro benefits.",
      "More healthy food options needed.",
      "Allow order modification after placing.",
      "Add UPI autopay for subscription.",
    ],
    feedback: [
      "Fastest delivery I've ever experienced!",
      "Clean and intuitive app design.",
      "Delivery partner smiled and wished me well.",
      "Gold membership is worth every rupee.",
      "Food tastes better than dining in!",
      "Zomato is my go-to for everything.",
      "Blinkit saved my party with quick delivery.",
      "Issue resolved in minutes by support.",
      "Food came piping hot. Impressed!",
      "Prices are competitive and fair.",
    ],
  },
  blinkit: {
    issues: [
      "Delivery promised in 10 mins, came after {time} mins.",
      "Vegetables were not fresh at all.",
      "Delivery person was impatient and rude.",
      "App crashes when adding items to cart.",
      "Payment gateway issues constantly.",
      "Received expired products twice now.",
      "Order cancelled after waiting for an hour.",
      "Refund for wrong items still pending.",
      "Can't update delivery location in app.",
      "No response from customer support chat.",
      "Milk packets were leaking badly.",
      "Half the items in my order were out of stock.",
      "Store shows open but all items unavailable.",
      "Delivery charged even for delayed orders.",
      "Product quality has deteriorated recently.",
    ],
    requests: [
      "Expand to more neighborhoods please.",
      "Free delivery for orders above 500.",
      "Use better packaging for fragile items.",
      "Night mode for the app would be nice.",
      "Offer loyalty discounts for regulars.",
      "Open earlier in the morning.",
      "Same day delivery for larger orders.",
      "Add organic produce section.",
      "Let us save favorite items easily.",
      "More payment options including wallets.",
    ],
    feedback: [
      "10 minute delivery is actually real!",
      "Love how simple the app is.",
      "Delivery guy was super friendly.",
      "Great offers every week.",
      "Products are always fresh.",
      "Best grocery app hands down.",
      "Saved my time so many times.",
      "Quick resolution for any issues.",
      "Packaging is secure and clean.",
      "Value for money products.",
    ],
  },
};

const USERNAMES = [
  "happyuser123", "foodlover_21", "quickbuyer", "dailyorderer", "criticalreviewer",
  "satisfied_customer", "angry_user", "tech_savvy", "budget_shopper", "premium_member",
  "new_user_2024", "loyal_customer", "first_timer", "regular_orderer", "weekend_warrior",
  "midnight_craver", "health_conscious", "busy_professional", "family_shopper", "student_user",
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomTime(): string {
  return String(Math.floor(Math.random() * 60) + 15);
}

function generateReviewText(app: string, type: 'issues' | 'requests' | 'feedback'): string {
  const appKey = app as keyof typeof REVIEW_TEMPLATES;
  const templates = REVIEW_TEMPLATES[appKey]?.[type] || REVIEW_TEMPLATES.swiggy[type];
  let text = getRandomElement(templates);
  text = text.replace('{time}', generateRandomTime());
  return text;
}

function generateRating(type: 'issues' | 'requests' | 'feedback'): number {
  if (type === 'issues') {
    return Math.floor(Math.random() * 2) + 1; // 1-2 stars
  } else if (type === 'requests') {
    return Math.floor(Math.random() * 2) + 2; // 2-3 stars
  } else {
    return Math.floor(Math.random() * 2) + 4; // 4-5 stars
  }
}

export function generateReviewsForDate(app: string, date: Date, count: number = 50): Review[] {
  const reviews: Review[] = [];
  const dateStr = format(date, 'yyyy-MM-dd');
  
  // Distribution: 50% issues, 30% feedback, 20% requests
  const issueCount = Math.floor(count * 0.5);
  const feedbackCount = Math.floor(count * 0.3);
  const requestCount = count - issueCount - feedbackCount;
  
  for (let i = 0; i < issueCount; i++) {
    reviews.push({
      id: `${dateStr}-issue-${i}`,
      date: dateStr,
      rating: generateRating('issues'),
      text: generateReviewText(app, 'issues'),
      app,
      username: getRandomElement(USERNAMES),
    });
  }
  
  for (let i = 0; i < feedbackCount; i++) {
    reviews.push({
      id: `${dateStr}-feedback-${i}`,
      date: dateStr,
      rating: generateRating('feedback'),
      text: generateReviewText(app, 'feedback'),
      app,
      username: getRandomElement(USERNAMES),
    });
  }
  
  for (let i = 0; i < requestCount; i++) {
    reviews.push({
      id: `${dateStr}-request-${i}`,
      date: dateStr,
      rating: generateRating('requests'),
      text: generateReviewText(app, 'requests'),
      app,
      username: getRandomElement(USERNAMES),
    });
  }
  
  return reviews;
}

export function generateReviewsForDateRange(
  app: string,
  startDate: Date,
  endDate: Date,
  dailyReviewCount: number = 50
): Review[] {
  const dates = eachDayOfInterval({ start: startDate, end: endDate });
  const allReviews: Review[] = [];
  
  for (const date of dates) {
    // Add some variance to daily count
    const variance = Math.floor(Math.random() * 30) - 15;
    const count = Math.max(20, dailyReviewCount + variance);
    allReviews.push(...generateReviewsForDate(app, date, count));
  }
  
  return allReviews;
}
