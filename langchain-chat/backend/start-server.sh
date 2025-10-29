#!/bin/bash

export http_proxy=http://tkyproxy-std.intra.tis.co.jp:8080
export https_proxy=http://tkyproxy-std.intra.tis.co.jp:8080


uv run uvicorn app.main:app --reload