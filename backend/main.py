import os
import json
from dotenv import load_dotenv
load_dotenv()
import io
import base64
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from groq import Groq

app = FastAPI(title="Talk with CSV API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


csv_store: dict[str, pd.DataFrame] = {}

SYSTEM_PROMPT = """You are a data analyst assistant. The user has uploaded a CSV file.
You will be given the schema (columns + dtypes + sample rows) and asked questions.

Respond in this EXACT JSON format, nothing else:
{
  "answer": "Your plain English explanation here",
  "chart": {
    "type": "bar" | "line" | "pie" | "scatter" | "hist" | null,
    "x": "column_name_or_null",
    "y": "column_name_or_null",
    "title": "Chart title",
    "color": null
  },
  "table": [{"col": "val"}, ...] | null
}

Rules:
- Return ONLY the JSON object. No markdown fences, no extra text before or after.
- chart is null if no visualization is needed.
- table is null if no tabular result is needed. Use table for top-N results, groupby results, etc. Max 20 rows.
- For pie charts, x = category column, y = value column.
- For hist, x = numeric column, y = null.
- answer should be concise (1-3 sentences), human-friendly, insightful.
- If asked something unanswerable from the data, say so in answer and set chart+table to null.
"""


class QueryRequest(BaseModel):
    session_id: str
    question: str


class QueryResponse(BaseModel):
    answer: str
    chart_b64: str | None = None
    table: list[dict] | None = None
    error: str | None = None


@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "Only CSV files are supported.")
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(400, f"Could not parse CSV: {e}")

    session_id = base64.urlsafe_b64encode(os.urandom(12)).decode()
    csv_store[session_id] = df

    schema = {
        "shape": list(df.shape),
        "columns": {col: str(df[col].dtype) for col in df.columns},
        "sample": df.head(5).to_dict(orient="records"),
        "nulls": df.isnull().sum().to_dict(),
    }

    return {
        "session_id": session_id,
        "filename": file.filename,
        "rows": df.shape[0],
        "columns": list(df.columns),
        "dtypes": {col: str(df[col].dtype) for col in df.columns},
        "schema": schema,
    }


@app.post("/query", response_model=QueryResponse)
async def query_csv(req: QueryRequest):
    df = csv_store.get(req.session_id)
    if df is None:
        raise HTTPException(404, "Session not found. Please re-upload your CSV.")

    schema = {
        "shape": list(df.shape),
        "columns": {col: str(df[col].dtype) for col in df.columns},
        "sample": df.head(5).to_dict(orient="records"),
    }

    user_message = f"""CSV Schema:
{json.dumps(schema, indent=2)}

User question: {req.question}

Respond only with the JSON format described. No markdown, no extra text."""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=2048,
            temperature=0.1,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
        )
        raw = response.choices[0].message.content.strip()

        # Strip markdown fences if the model adds them anyway
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        parsed = json.loads(raw)

    except json.JSONDecodeError:
        return QueryResponse(answer=raw, error="Could not parse structured response.")
    except Exception as e:
        return QueryResponse(answer="", error=str(e))

    answer = parsed.get("answer", "")
    table = parsed.get("table")
    chart_spec = parsed.get("chart")
    chart_b64 = None

    if chart_spec and chart_spec.get("type"):
        try:
            chart_b64 = generate_chart(df, chart_spec)
        except Exception as e:
            answer += f"\n\n(Chart generation failed: {e})"

    return QueryResponse(answer=answer, chart_b64=chart_b64, table=table)


def generate_chart(df: pd.DataFrame, spec: dict) -> str:
    chart_type = spec.get("type")
    x_col = spec.get("x")
    y_col = spec.get("y")
    title = spec.get("title", "")

    fig, ax = plt.subplots(figsize=(9, 5))
    fig.patch.set_facecolor("#0f0f14")
    ax.set_facecolor("#0f0f14")
    ax.tick_params(colors="#a0a0b8", labelsize=10)
    for spine in ax.spines.values():
        spine.set_edgecolor("#2a2a3e")
    ax.xaxis.label.set_color("#a0a0b8")
    ax.yaxis.label.set_color("#a0a0b8")
    ax.title.set_color("#e8e8f0")

    ACCENT = "#7c6af7"
    ACCENT2 = "#4ecdc4"

    if chart_type == "bar":
        if x_col and y_col:
            data = df.groupby(x_col)[y_col].sum().reset_index()
            ax.bar(data[x_col].astype(str), data[y_col], color=ACCENT, edgecolor="none")
            ax.set_xlabel(x_col)
            ax.set_ylabel(y_col)
            if len(data) > 8:
                plt.xticks(rotation=45, ha="right")
        else:
            df[x_col or df.columns[0]].value_counts().head(15).plot(kind="bar", ax=ax, color=ACCENT)
            plt.xticks(rotation=45, ha="right")

    elif chart_type == "line":
        if x_col and y_col:
            plot_df = df[[x_col, y_col]].dropna().sort_values(x_col)
            ax.plot(plot_df[x_col].astype(str), plot_df[y_col], color=ACCENT, linewidth=2, marker="o", markersize=4)
            ax.set_xlabel(x_col)
            ax.set_ylabel(y_col)
            if len(plot_df) > 10:
                step = max(1, len(plot_df) // 10)
                ax.set_xticks(ax.get_xticks()[::step])
            plt.xticks(rotation=45, ha="right")

    elif chart_type == "pie":
        if x_col and y_col:
            data = df.groupby(x_col)[y_col].sum()
        elif x_col:
            data = df[x_col].value_counts().head(8)
        else:
            data = df[df.columns[0]].value_counts().head(8)
        colors = [ACCENT, ACCENT2, "#f7c26a", "#f76a8a", "#6af7c2", "#c26af7", "#f7a06a", "#6ac2f7"]
        wedges, texts, autotexts = ax.pie(
            data.values, labels=data.index.astype(str),
            autopct="%1.1f%%", colors=colors[:len(data)],
            textprops={"color": "#e8e8f0", "fontsize": 9}
        )
        for at in autotexts:
            at.set_color("#0f0f14")

    elif chart_type == "scatter":
        if x_col and y_col:
            ax.scatter(df[x_col], df[y_col], color=ACCENT, alpha=0.6, edgecolors="none", s=40)
            ax.set_xlabel(x_col)
            ax.set_ylabel(y_col)

    elif chart_type == "hist":
        if x_col:
            ax.hist(df[x_col].dropna(), bins=25, color=ACCENT, edgecolor="#0f0f14")
            ax.set_xlabel(x_col)
            ax.set_ylabel("Count")

    ax.set_title(title, pad=12, fontsize=13, color="#e8e8f0")
    plt.tight_layout()

    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=130, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode()


@app.get("/health")
def health():
    return {"status": "ok"}
