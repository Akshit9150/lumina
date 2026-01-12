import { chromium, Browser } from "playwright";

const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;

async function getBrowser(): Promise<Browser> {
    // Use Browserless in production, local Playwright in development
    if (BROWSERLESS_API_KEY && process.env.NODE_ENV === "production") {
        return chromium.connect(
            `wss://chrome.browserless.io?token=${BROWSERLESS_API_KEY}`
        );
    }

    // Local development - uses local Playwright installation
    return chromium.launch({
        headless: true,
    });
}

export async function scrapeImages(url: string): Promise<string[]> {
    const browser = await getBrowser();

    try {
        const page = await browser.newPage();

        // Set a reasonable timeout
        page.setDefaultTimeout(30000);

        // Navigate to the URL
        await page.goto(url, { waitUntil: "networkidle" });

        // Wait a bit for lazy-loaded images
        await page.waitForTimeout(2000);

        // Extract all image URLs
        const images = await page.evaluate(() => {
            const imgElements = document.querySelectorAll("img");
            const srcSet = new Set<string>();

            imgElements.forEach((img) => {
                // Get src attribute
                const src = img.src;
                if (src && src.startsWith("http")) {
                    srcSet.add(src);
                }

                // Also check srcset for higher quality images
                const srcset = img.getAttribute("srcset");
                if (srcset) {
                    const srcsetUrls = srcset.split(",").map((s) => s.trim().split(" ")[0]);
                    srcsetUrls.forEach((url) => {
                        if (url && url.startsWith("http")) {
                            srcSet.add(url);
                        }
                    });
                }

                // Check data-src for lazy loaded images
                const dataSrc = img.getAttribute("data-src");
                if (dataSrc && dataSrc.startsWith("http")) {
                    srcSet.add(dataSrc);
                }
            });

            return Array.from(srcSet);
        });

        // Filter out common non-product images
        const filteredImages = images.filter((url) => {
            const lowerUrl = url.toLowerCase();
            // Filter out common UI elements and icons
            const excludePatterns = [
                "logo",
                "icon",
                "sprite",
                "placeholder",
                "loading",
                "pixel",
                "tracking",
                "blank",
                "1x1",
                "svg",
                "gif",
            ];
            return !excludePatterns.some((pattern) => lowerUrl.includes(pattern));
        });

        // Filter for reasonable image dimensions (likely product images)
        // We'll check the URL for size hints or just return all valid images
        return filteredImages.slice(0, 50); // Limit to 50 images
    } finally {
        await browser.close();
    }
}
