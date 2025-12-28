import { Hono } from 'hono'
import { renderer } from './renderer'
import { basicAuth } from 'hono/basic-auth'
import { marked } from 'marked'

type Bindings = {
  DB: D1Database
  ADMIN_USER?: string
  ADMIN_PASSWORD?: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use(renderer)

// --- Helper Functions ---
const getPostList = async (db: D1Database) => {
  const { results } = await db.prepare(
    'SELECT id, title, slug, excerpt, views, created_at FROM posts ORDER BY created_at DESC'
  ).all()
  return results
}

const getPostBySlug = async (db: D1Database, slug: string) => {
  return await db.prepare('SELECT * FROM posts WHERE slug = ?').bind(slug).first()
}

const getPostById = async (db: D1Database, id: number) => {
  return await db.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first()
}

const getCommentsByPostId = async (db: D1Database, postId: number) => {
  const { results } = await db.prepare(
    'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC'
  ).bind(postId).all()
  return results
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\. /g, '.').substring(0, 10) + '.'
}

const formatDateTime = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

// --- SEO Helper Routes ---

// Sitemap.xml
app.get('/sitemap.xml', async (c) => {
  const posts = await getPostList(c.env.DB)
  const baseUrl = 'https://story-darugi.com'
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/policy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  ${posts.map((post: any) => `
  <url>
    <loc>${baseUrl}/post/${post.slug}</loc>
    <lastmod>${new Date(post.created_at * 1000).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`

  return c.text(sitemap, 200, {
    'Content-Type': 'application/xml'
  })
})

// Robots.txt
app.get('/robots.txt', (c) => {
  const robots = `User-agent: *
Allow: /
Sitemap: https://story-darugi.com/sitemap.xml`
  
  return c.text(robots)
})


// --- API Routes ---
app.post('/api/like/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ?').bind(id).run()
  const post: any = await c.env.DB.prepare('SELECT likes FROM posts WHERE id = ?').bind(id).first()
  return c.json({ likes: post.likes })
})

app.post('/api/share/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('UPDATE posts SET shares = shares + 1 WHERE id = ?').bind(id).run()
  const post: any = await c.env.DB.prepare('SELECT shares FROM posts WHERE id = ?').bind(id).first()
  return c.json({ shares: post.shares })
})

app.post('/api/comment', async (c) => {
  const body = await c.req.parseBody()
  const { post_id, author, content, slug } = body
  
  if (!author || !content) {
    return c.text('Name and Content are required', 400)
  }

  await c.env.DB.prepare(
    'INSERT INTO comments (post_id, author, content) VALUES (?, ?, ?)'
  ).bind(post_id, author, content).run()
  
  return c.redirect(`/post/${slug}#comments`)
})

// --- Public Routes ---

app.get('/', async (c) => {
  const posts: any[] = await getPostList(c.env.DB)
  const totalPosts = posts.length
  
  return c.render(
    <>
      {/* Hero Section */}
      <section class="h-[60vh] flex flex-col justify-center items-center text-center px-4">
        <h1 class="text-5xl md:text-7xl lg:text-8xl font-thin text-[#787FFF] tracking-[0.1em] font-title uppercase mb-4 drop-shadow-sm">
          Story Darugi
        </h1>
      </section>

      {/* Post List Section */}
      <section class="max-w-5xl mx-auto px-4 pb-20 -mt-20 relative z-10">
        <div class="bg-white rounded-t-2xl shadow-lg border border-gray-100 overflow-hidden min-h-[500px]">
          
          {/* List Header */}
          <div class="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
            <span class="text-sm text-gray-500 font-light">
              전체보기 <strong class="text-[#787FFF] font-medium">{totalPosts}</strong>개의 글
            </span>
            <span class="text-xs text-gray-400 cursor-pointer hover:text-gray-600">목록닫기</span>
          </div>

          {/* Table Header (Desktop) */}
          <div class="hidden md:flex bg-gray-50 px-6 py-3 border-b border-gray-100 text-xs text-gray-400 font-light">
            <div class="flex-grow pl-2">글 제목</div>
            <div class="w-20 text-center">조회수</div>
            <div class="w-24 text-center">작성일</div>
          </div>

          {/* List Items */}
          <div class="divide-y divide-gray-50">
            {posts.map((post: any) => (
              <div class="group hover:bg-gray-50 transition-colors duration-200">
                <a href={`/post/${post.slug}`} class="block px-6 py-4 md:py-3 flex flex-col md:flex-row md:items-center">
                  {/* Title */}
                  <div class="flex-grow mb-1 md:mb-0 pr-4">
                    <span class="text-gray-600 group-hover:text-[#787FFF] transition-colors text-sm font-light truncate block">
                      {post.title}
                    </span>
                  </div>
                  
                  {/* Meta Info (Mobile) */}
                  <div class="flex md:hidden text-xs text-gray-300 gap-2 mt-1 font-light">
                    <span>{formatDate(post.created_at)}</span>
                    <span>•</span>
                    <span>조회 {post.views || 0}</span>
                  </div>

                  {/* Meta Info (Desktop) */}
                  <div class="hidden md:flex text-xs text-gray-400 font-light items-center">
                    <div class="w-20 text-center">{post.views || 0}</div>
                    <div class="w-24 text-center">{formatDate(post.created_at)}</div>
                  </div>
                </a>
              </div>
            ))}
            
            {posts.length === 0 && (
              <div class="text-center py-20 text-gray-400 font-light text-sm">
                <p>작성된 글이 없습니다.</p>
              </div>
            )}
          </div>

          {/* List Footer */}
          <div class="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
            {/* Empty div for layout balance */}
            <div></div>
            
            {/* Simple Pagination */}
            <div class="flex gap-1">
               <span class="w-6 h-6 flex items-center justify-center text-xs text-white bg-[#787FFF] rounded-sm cursor-pointer">1</span>
               {/* Pagination logic would go here */}
            </div>

            <div class="text-xs text-gray-400 border border-gray-200 bg-white px-2 py-1.5 rounded flex items-center gap-1 cursor-pointer hover:border-gray-300">
              5줄 보기 <i class="fas fa-chevron-down text-[10px]"></i>
            </div>
          </div>

        </div>
      </section>
    </>,
    { 
      title: 'Home',
      description: '일상의 모든 순간을 기록하고 공유하는 공간, 스토리 다루기입니다.',
      url: '/'
    }
  )
})

app.get('/post/:slug', async (c) => {
  const slug = c.req.param('slug')
  
  // Increase View Count
  const postCheck: any = await getPostBySlug(c.env.DB, slug)
  if (postCheck) {
    await c.env.DB.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').bind(postCheck.id).run()
  }

  const post: any = await getPostBySlug(c.env.DB, slug)
  
  if (!post) {
    return c.render(
      <div class="min-h-screen flex flex-col justify-center items-center text-center px-4 -mt-20">
        <h1 class="text-4xl font-thin text-white mb-4">Post Not Found</h1>
        <p class="text-white/70 mb-8 font-light">요청하신 페이지가 존재하지 않습니다.</p>
        <a href="/" class="px-6 py-2 border border-white/40 text-white rounded-full hover:bg-white hover:text-[#787FFF] transition-all text-sm tracking-widest uppercase">Back Home</a>
      </div>,
      { title: 'Not Found' }
    )
  }

  const comments = await getCommentsByPostId(c.env.DB, post.id)
  const htmlContent = marked.parse(post.content)

  // Use excerpt or first 150 chars of content for description
  const metaDescription = post.excerpt || post.content.substring(0, 150).replace(/[#*`]/g, '') + '...';

  return c.render(
    <article class="pt-10 pb-20">
      <header class="mb-12 text-center">
        <h1 class="text-4xl md:text-6xl font-thin text-gray-800 mb-4 tracking-tight leading-tight">{post.title}</h1>
        <div class="flex justify-center items-center gap-4 text-sm text-gray-500 font-light tracking-widest uppercase">
            <span>{formatDate(post.created_at)}</span>
            <span class="w-px h-3 bg-gray-300"></span>
            <span><i class="far fa-eye mr-1"></i> {post.views}</span>
        </div>
      </header>
      
      <div class="max-w-3xl mx-auto bg-white/90 backdrop-blur rounded-xl p-8 md:p-12 shadow-sm">
        {/* AdSense Placeholder */}
        <div class="bg-gray-50/50 p-6 mb-10 text-center text-gray-400 rounded-lg border border-dashed border-gray-200 text-xs tracking-widest">
          AD AREA TOP
        </div>

        <div class="markdown-body font-light" dangerouslySetInnerHTML={{ __html: htmlContent }} />
        
        {/* AdSense Placeholder */}
        <div class="bg-gray-50/50 p-6 mt-10 text-center text-gray-400 rounded-lg border border-dashed border-gray-200 text-xs tracking-widest">
          AD AREA BOTTOM
        </div>

        {/* Interaction Buttons */}
        <div class="mt-16 flex justify-center gap-4">
          <button 
            onclick={`likePost(${post.id})`}
            class="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded text-sm hover:border-red-300 hover:text-red-500 transition-all"
          >
            <i class="far fa-heart" id={`like-icon-${post.id}`}></i>
            <span class="font-medium">공감</span>
            <span id={`like-count-${post.id}`} class="font-bold ml-1">{post.likes}</span>
          </button>

          <button 
            onclick={`sharePost(${post.id}, '${post.title}')`}
            class="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded text-sm hover:border-[#787FFF] hover:text-[#787FFF] transition-all"
          >
            <i class="fas fa-share-alt"></i>
            <span class="font-medium">공유</span>
            <span id={`share-count-${post.id}`} class="font-bold ml-1">{post.shares}</span>
          </button>
        </div>

        {/* Comments Section */}
        <div class="mt-16 pt-10 border-t border-gray-100" id="comments">
            <h3 class="text-xl font-light text-gray-800 mb-6 flex items-center gap-2">
                <i class="far fa-comment-dots"></i> 댓글 <span class="font-bold text-[#787FFF]">{comments.length}</span>
            </h3>

            {/* Comment Form */}
            <form action="/api/comment" method="post" class="mb-10 bg-gray-50/50 p-6 rounded-lg border border-gray-100">
                <input type="hidden" name="post_id" value={post.id} />
                <input type="hidden" name="slug" value={post.slug} />
                <div class="flex gap-4 mb-4">
                    <input type="text" name="author" placeholder="닉네임" required class="flex-1 bg-white border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#787FFF]" />
                    <button type="submit" class="px-6 py-2 bg-[#787FFF] text-white text-sm rounded hover:bg-[#686fe0] transition-colors">등록</button>
                </div>
                <textarea name="content" rows="3" placeholder="댓글을 남겨주세요..." required class="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#787FFF] resize-none"></textarea>
            </form>

            {/* Comment List */}
            <div class="space-y-6">
                {comments.map((comment: any) => (
                    <div class="flex gap-4">
                        <div class="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="flex-grow">
                            <div class="flex items-baseline gap-2 mb-1">
                                <span class="font-bold text-gray-700 text-sm">{comment.author}</span>
                                <span class="text-xs text-gray-400">{formatDateTime(comment.created_at)}</span>
                            </div>
                            <p class="text-gray-600 text-sm leading-relaxed">{comment.content}</p>
                        </div>
                    </div>
                ))}
                {comments.length === 0 && (
                    <p class="text-center text-gray-400 text-sm py-4">첫 번째 댓글을 남겨보세요!</p>
                )}
            </div>
        </div>

      </div>

      <div class="mt-16 text-center">
         <a href="/" class="inline-block px-8 py-3 border border-gray-300 text-gray-500 rounded-full hover:border-[#787FFF] hover:text-[#787FFF] transition-all text-xs tracking-widest uppercase bg-white/50 backdrop-blur-sm">
            Back to List
         </a>
      </div>

      {/* Client-side Script for Interactions */}
      <script dangerouslySetInnerHTML={{ __html: `
        async function likePost(id) {
          try {
            const res = await fetch('/api/like/' + id, { method: 'POST' });
            const data = await res.json();
            document.getElementById('like-count-' + id).innerText = data.likes;
            
            // Heart Animation
            const icon = document.getElementById('like-icon-' + id);
            icon.classList.remove('far');
            icon.classList.add('fas', 'text-red-500');
          } catch (e) { console.error(e); }
        }

        async function sharePost(id, title) {
          try {
            // Copy URL
            await navigator.clipboard.writeText(window.location.href);
            alert('링크가 복사되었습니다!');

            const res = await fetch('/api/share/' + id, { method: 'POST' });
            const data = await res.json();
            document.getElementById('share-count-' + id).innerText = data.shares;
          } catch (e) { 
            console.error(e);
            alert('공유하기에 실패했습니다.');
          }
        }
      `}} />
    </article>,
    { 
      title: post.title,
      description: metaDescription,
      url: `/post/${slug}`
    }
  )
})

app.get('/policy', (c) => {
  return c.render(
    <div class="max-w-3xl mx-auto bg-white/90 backdrop-blur rounded-xl p-10 md:p-14 shadow-sm mt-10 mb-20">
      <h1 class="text-3xl font-light mb-8 pb-4 border-b border-gray-100 text-gray-800">Privacy Policy</h1>
      <div class="prose max-w-none text-gray-600 space-y-6 font-light">
        <p class="text-sm text-gray-400">Last updated: {new Date().toLocaleDateString('ko-KR')}</p>
        <p>이 개인정보처리방침은 귀하가 서비스를 이용할 때 귀하의 정보를 수집, 사용 및 공개하는 것에 대한 당사의 정책 및 절차를 설명합니다...</p>
        <h2 class="text-xl font-medium mt-8 text-gray-800">개인 데이터 수집 및 사용</h2>
        <p>당사는 귀하가 명시적으로 제공하지 않는 한 어떠한 개인 데이터도 저장하지 않습니다. 쿠키 사용 및 제3자 광고 서비스(Google AdSense)와 관련된 내용은 다음과 같습니다...</p>
      </div>
    </div>,
    { title: 'Privacy Policy' }
  )
})

// --- Admin Routes ---

// Secure all admin routes
app.use('/admin/*', async (c, next) => {
  const auth = basicAuth({
    username: c.env.ADMIN_USER || 'admin',
    password: c.env.ADMIN_PASSWORD || 'password',
  })
  return auth(c, next)
})

app.get('/admin', async (c) => {
  const posts = await getPostList(c.env.DB)
  
  return c.render(
    <div class="bg-white/95 backdrop-blur-xl p-8 rounded-xl shadow-lg border border-white/20 mt-10 mb-20 max-w-5xl mx-auto">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 class="text-3xl font-thin text-gray-900">Admin Dashboard</h1>
            <p class="text-gray-500 mt-1 font-light text-sm">Manage your stories</p>
        </div>
        <a href="/admin/new" class="bg-[#787FFF] text-white px-6 py-2.5 rounded-full text-sm font-medium shadow-md hover:shadow-lg hover:bg-[#686fe0] transition-all">
          <i class="fas fa-plus mr-2"></i> New Post
        </a>
      </div>
      
      <div class="overflow-x-auto rounded-lg border border-gray-100">
        <table class="w-full text-left">
          <thead class="bg-gray-50">
            <tr class="text-gray-400 text-xs uppercase tracking-widest">
              <th class="py-4 px-6 font-medium">Title</th>
              <th class="py-4 px-6 font-medium">Date</th>
              <th class="py-4 px-6 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            {posts.map((post: any) => (
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="py-4 px-6 font-medium text-gray-800">{post.title}</td>
                <td class="py-4 px-6 text-gray-500 text-xs font-light tracking-wide">{formatDate(post.created_at)}</td>
                <td class="py-4 px-6 text-right space-x-3">
                  <a href={`/admin/edit/${post.id}`} class="text-[#787FFF] font-medium hover:text-[#5a5fcf] text-xs uppercase tracking-wider">Edit</a>
                  <form action={`/admin/delete/${post.id}`} method="post" class="inline" onSubmit="return confirm('Really delete?');">
                    <button type="submit" class="text-red-400 font-medium hover:text-red-600 text-xs uppercase tracking-wider ml-2">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>,
    { title: 'Admin' }
  )
})

app.get('/admin/new', (c) => {
  return c.render(
    <div class="bg-white/95 backdrop-blur-xl p-8 rounded-xl shadow-lg border border-white/20 mt-10 mb-20 max-w-4xl mx-auto">
      <h1 class="text-3xl font-thin mb-8 text-gray-800">New Story</h1>
      <form action="/admin/save" method="post" class="space-y-6">
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Title</label>
          <input type="text" name="title" required class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#787FFF]/20 focus:border-[#787FFF] focus:outline-none transition-all" />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Slug</label>
          <input type="text" name="slug" required class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#787FFF]/20 focus:border-[#787FFF] focus:outline-none transition-all" />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Excerpt</label>
          <textarea name="excerpt" rows="2" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#787FFF]/20 focus:border-[#787FFF] focus:outline-none transition-all"></textarea>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Content</label>
          <textarea name="content" rows="20" required class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-[#787FFF]/20 focus:border-[#787FFF] focus:outline-none transition-all"></textarea>
        </div>
        <div class="flex justify-end space-x-4 pt-6 border-t border-gray-100">
          <a href="/admin" class="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-500 text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</a>
          <button type="submit" class="bg-[#787FFF] text-white px-8 py-2.5 rounded-lg text-sm font-medium shadow-md hover:bg-[#686fe0] transition-all">Publish</button>
        </div>
      </form>
    </div>,
    { title: 'New Post' }
  )
})

app.get('/admin/edit/:id', async (c) => {
  const id = c.req.param('id')
  const post: any = await getPostById(c.env.DB, Number(id))

  if (!post) return c.redirect('/admin')

  return c.render(
    <div class="bg-white/95 backdrop-blur-xl p-8 rounded-xl shadow-lg border border-white/20 mt-10 mb-20 max-w-4xl mx-auto">
      <h1 class="text-3xl font-thin mb-8 text-gray-800">Edit Story</h1>
      <form action="/admin/save" method="post" class="space-y-6">
        <input type="hidden" name="id" value={post.id} />
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Title</label>
          <input type="text" name="title" value={post.title} required class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#787FFF]/20 focus:border-[#787FFF] focus:outline-none transition-all" />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Slug</label>
          <input type="text" name="slug" value={post.slug} required class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#787FFF]/20 focus:border-[#787FFF] focus:outline-none transition-all" />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Excerpt</label>
          <textarea name="excerpt" rows="2" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#787FFF]/20 focus:border-[#787FFF] focus:outline-none transition-all">{post.excerpt}</textarea>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Content</label>
          <textarea name="content" rows="20" required class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-[#787FFF]/20 focus:border-[#787FFF] focus:outline-none transition-all">{post.content}</textarea>
        </div>
        <div class="flex justify-end space-x-4 pt-6 border-t border-gray-100">
          <a href="/admin" class="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-500 text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</a>
          <button type="submit" class="bg-[#787FFF] text-white px-8 py-2.5 rounded-lg text-sm font-medium shadow-md hover:bg-[#686fe0] transition-all">Update</button>
        </div>
      </form>
    </div>,
    { title: 'Edit Post' }
  )
})

app.post('/admin/save', async (c) => {
  const body = await c.req.parseBody()
  const { id, title, slug, excerpt, content } = body

  if (id) {
    // Update
    await c.env.DB.prepare(
      'UPDATE posts SET title = ?, slug = ?, excerpt = ?, content = ?, updated_at = ? WHERE id = ?'
    ).bind(title, slug, excerpt, content, Math.floor(Date.now() / 1000), id).run()
  } else {
    // Insert
    try {
      await c.env.DB.prepare(
        'INSERT INTO posts (title, slug, excerpt, content) VALUES (?, ?, ?, ?)'
      ).bind(title, slug, excerpt, content).run()
    } catch (e) {
      // Handle duplicate slug error usually
      return c.text('오류: 이미 존재하는 URL 슬러그입니다. 다른 슬러그를 사용해주세요.', 400)
    }
  }

  return c.redirect('/admin')
})

app.post('/admin/delete/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run()
  return c.redirect('/admin')
})

export default app
