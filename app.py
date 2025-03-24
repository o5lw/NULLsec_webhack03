from flask import Flask, render_template, request, jsonify
import pymysql

app = Flask(__name__)

def get_db():
    return pymysql.connect(
        host='127.0.0.1',
        user='root',
        password='0819',  # 본인 비밀번호
        database='todo_db',
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

@app.route('/')
def index():
    return render_template('index.html')

# 일정 불러오기
@app.route('/api/schedules')
def get_schedules():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM schedules")
    data = cursor.fetchall()
    conn.close()
    return jsonify(data)

# 일정 추가
@app.route('/api/schedules', methods=['POST'])
def add_schedule():
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO schedules (date, content, emoji) VALUES (%s, %s, %s)",
                   (data['date'], data.get('content'), data.get('emoji')))
    conn.commit()
    conn.close()
    return jsonify({'result': 'success'})

# 일기 불러오기
@app.route('/api/diary')
def get_diary():
    keyword = request.args.get('keyword', '')
    search_type = request.args.get('type', 'all')
    conn = get_db()
    cursor = conn.cursor()
    if keyword:
        if search_type == 'title':
            sql = "SELECT * FROM diary WHERE title LIKE %s ORDER BY created_at DESC"
            cursor.execute(sql, (f"%{keyword}%",))
        elif search_type == 'content':
            sql = "SELECT * FROM diary WHERE content LIKE %s ORDER BY created_at DESC"
            cursor.execute(sql, (f"%{keyword}%",))
        else:
            sql = "SELECT * FROM diary WHERE title LIKE %s OR content LIKE %s ORDER BY created_at DESC"
            cursor.execute(sql, (f"%{keyword}%", f"%{keyword}%"))
    else:
        cursor.execute("SELECT * FROM diary ORDER BY created_at DESC")
    data = cursor.fetchall()
    conn.close()
    return jsonify(data)

# 일기 추가
@app.route('/api/diary', methods=['POST'])
def add_diary():
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO diary (title, content) VALUES (%s, %s)",
                   (data['title'], data['content']))
    conn.commit()
    conn.close()
    return jsonify({'result': 'success'})

# 일기 수정/삭제
@app.route('/api/diary/<int:diary_id>', methods=['PUT', 'DELETE'])
def modify_diary(diary_id):
    conn = get_db()
    cursor = conn.cursor()
    if request.method == 'PUT':
        data = request.json
        cursor.execute("UPDATE diary SET title=%s, content=%s WHERE id=%s",
                       (data['title'], data['content'], diary_id))
    else:
        cursor.execute("DELETE FROM diary WHERE id=%s", (diary_id,))
    conn.commit()
    conn.close()
    return jsonify({'result': 'success'})

if __name__ == '__main__':
    app.run(debug=True)

