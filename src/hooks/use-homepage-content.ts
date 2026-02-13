import { useState, useEffect } from 'react';
import { homepageContentService } from '@/lib/services/homepage-content.service';
import type { Course, LearningMethod, Feature, FAQ, Comparison } from '@/lib/services/homepage-content.service';

export function useHomepageCourses() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            const data = await homepageContentService.getCourses();
            setCourses(data);
            setLoading(false);
        };
        fetchCourses();
    }, []);

    return { courses, loading };
}

export function useLearningMethods() {
    const [methods, setMethods] = useState<LearningMethod[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMethods = async () => {
            setLoading(true);
            const data = await homepageContentService.getLearningMethods();
            setMethods(data);
            setLoading(false);
        };
        fetchMethods();
    }, []);

    return { methods, loading };
}

export function useFeatures() {
    const [features, setFeatures] = useState<Feature[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeatures = async () => {
            setLoading(true);
            const data = await homepageContentService.getFeatures();
            setFeatures(data);
            setLoading(false);
        };
        fetchFeatures();
    }, []);

    return { features, loading };
}

export function useFAQs() {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFAQs = async () => {
            setLoading(true);
            const data = await homepageContentService.getFAQs();
            setFaqs(data);
            setLoading(false);
        };
        fetchFAQs();
    }, []);

    return { faqs, loading };
}

export function useComparisons() {
    const [comparisons, setComparisons] = useState<Comparison[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchComparisons = async () => {
            setLoading(true);
            const data = await homepageContentService.getComparisons();
            setComparisons(data);
            setLoading(false);
        };
        fetchComparisons();
    }, []);

    return { comparisons, loading };
}
