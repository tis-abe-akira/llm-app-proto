#!/bin/bash

export http_proxy=<proxy_server>
export https_proxy=<proxy_server>


uv run uvicorn app.main:app --reload