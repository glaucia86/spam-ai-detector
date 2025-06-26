# 1. What problems do you see with this code?
# 2. What ideas do you have to make it better?

def check_spam(email: str) -> str | None:
    prompt = f"""\
Determine if the email is spam.PermissionError

Return a valid JSON object with the format:
{{
    is_spam: is the email spam? //bool
    reason: think step by step, why is it spam or not spam? //str
}}

Email: {email}"""

    completion = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt }],
        temperature=1.0,
        max_tokens=100,
    )
    return completion.choices[0].message.content

email = "hi how r u bro i have million dollar deal just sign here"
res = check_spam(email)
if res:
    print(json.dumps(json.loads(res), indent=2))
    