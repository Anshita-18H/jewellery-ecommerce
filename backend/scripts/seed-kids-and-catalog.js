const db = require('../config/db');

async function main() {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    console.log('--- Backfilling missing tags on existing products ---');
    // Rule: Do NOT change any existing product's name, price, or existing non-empty tags.
    // id 3: Layered Pearl Necklace (Women Necklaces)
    await conn.query(`
      UPDATE products 
      SET gender_tag = 'women',
          occasion_tags = COALESCE(occasion_tags, 'gifting,everyday')
      WHERE id = 3
    `);

    // id 4: Temple Design Necklace
    await conn.query(`
      UPDATE products 
      SET gender_tag = COALESCE(gender_tag, 'women'),
          occasion_tags = COALESCE(occasion_tags, 'festive,wedding,gifting')
      WHERE id = 4
    `);

    // id 5: Kundan Drop Earrings
    await conn.query(`
      UPDATE products 
      SET gender_tag = COALESCE(gender_tag, 'women'),
          occasion_tags = COALESCE(occasion_tags, 'festive,wedding,gifting')
      WHERE id = 5
    `);

    // id 6: Minimalist Gold Studs
    await conn.query(`
      UPDATE products 
      SET gender_tag = COALESCE(gender_tag, 'women'),
          occasion_tags = COALESCE(occasion_tags, 'everyday,workwear')
      WHERE id = 6
    `);

    // id 7: Charm Bracelet
    await conn.query(`
      UPDATE products 
      SET gender_tag = COALESCE(gender_tag, 'women'),
          occasion_tags = COALESCE(occasion_tags, 'gifting,everyday')
      WHERE id = 7
    `);

    // id 8: Bridal Kundan Set
    await conn.query(`
      UPDATE products 
      SET gender_tag = COALESCE(gender_tag, 'women'),
          occasion_tags = COALESCE(occasion_tags, 'wedding,bridal,festive')
      WHERE id = 8
    `);

    console.log('--- Inserting new products if not already present ---');
    const newProducts = [
      {
        category_id: 2, // Necklaces
        name: 'Tiny Heart Pendant Necklace',
        slug: 'tiny-heart-pendant-necklace',
        description: 'Delicate handcrafted gold heart pendant on a lightweight hypoallergenic chain, designed specially for young jewellery lovers.',
        price: 1499.00,
        stock: 15,
        image_url: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&auto=format&fit=crop&q=80',
        is_featured: 1,
        occasion_tags: 'gifting,everyday',
        gender_tag: 'women'
      },
      {
        category_id: 3, // Earrings
        name: 'Kids Gold Stud Earrings',
        slug: 'kids-gold-stud-earrings',
        description: 'Hypoallergenic 18k gold safety-screw studs with smooth rounded edges, perfect for everyday gentle wear.',
        price: 999.00,
        stock: 20,
        image_url: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&auto=format&fit=crop&q=80',
        is_featured: 1,
        occasion_tags: 'gifting,everyday',
        gender_tag: 'kids'
      },
      {
        category_id: 1, // Rings (women)
        name: 'Diamond Halo Solitaire Ring',
        slug: 'diamond-halo-solitaire-ring',
        description: 'Brilliant cushion-cut solitaire ring surrounded by a shimmering micropavé halo in 18k rose gold.',
        price: 7999.00,
        stock: 12,
        image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80',
        is_featured: 0,
        occasion_tags: 'gifting,everyday',
        gender_tag: 'women'
      },
      {
        category_id: 2, // Necklaces (women)
        name: 'Solitaire Cushion Pendant',
        slug: 'solitaire-cushion-pendant',
        description: 'An understated solitaire diamond pendant suspended from a slender 18k yellow gold chain.',
        price: 5499.00,
        stock: 15,
        image_url: 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=800&auto=format&fit=crop&q=80',
        is_featured: 0,
        occasion_tags: 'everyday,gifting',
        gender_tag: 'women'
      },
      {
        category_id: 4, // Bracelets (women)
        name: 'Delicate Gold Link Bracelet',
        slug: 'delicate-gold-link-bracelet',
        description: 'Finely woven paperclip and oval link bracelet crafted in polished 18k gold for effortless stacking.',
        price: 3499.00,
        stock: 14,
        image_url: 'https://images.unsplash.com/photo-1602527418456-8b5cd2c7a4c2?w=800&auto=format&fit=crop&q=80',
        is_featured: 0,
        occasion_tags: 'everyday,gifting',
        gender_tag: 'women'
      },
      {
        category_id: 1, // Rings (men)
        name: "Men's Platinum Finish Band",
        slug: 'mens-platinum-finish-band',
        description: 'A sleek, beveled edge band with a brushed satin center and mirror-polished borders.',
        price: 9499.00,
        stock: 10,
        image_url: 'https://images.unsplash.com/photo-1551811040-f13e57351ef3?w=800&auto=format&fit=crop&q=80',
        is_featured: 0,
        occasion_tags: 'everyday,workwear',
        gender_tag: 'men'
      }
    ];

    for (const prod of newProducts) {
      const [existing] = await conn.query('SELECT id FROM products WHERE slug = ?', [prod.slug]);
      if (existing.length === 0) {
        await conn.query(
          `INSERT INTO products 
           (category_id, name, slug, description, price, stock, image_url, is_featured, occasion_tags, gender_tag)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            prod.category_id,
            prod.name,
            prod.slug,
            prod.description,
            prod.price,
            prod.stock,
            prod.image_url,
            prod.is_featured,
            prod.occasion_tags,
            prod.gender_tag
          ]
        );
        console.log(`Inserted: ${prod.name}`);
      } else {
        console.log(`Already exists: ${prod.name} (id ${existing[0].id})`);
      }
    }

    await conn.commit();
    console.log('Transaction committed successfully.');

    const [all] = await conn.query('SELECT id, name, category_id, price, gender_tag, occasion_tags FROM products ORDER BY id ASC');
    console.log('--- Current Products in Database ---');
    console.table(all);

  } catch (err) {
    await conn.rollback();
    console.error('Error during seeding:', err);
    process.exit(1);
  } finally {
    conn.release();
    process.exit(0);
  }
}

main();
